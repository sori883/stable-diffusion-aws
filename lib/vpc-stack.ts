import { Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { env } from "~/env";

export class VpcStack extends Stack {
  // 別スタックから参照できるようにする
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnetAZ1: ec2.Subnet;
  public readonly publicSubnetAZ2: ec2.Subnet;
  public readonly privateEC2Subnet: ec2.Subnet;
  public readonly ec2SecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly vpcEndpointSecurityGroup: ec2.SecurityGroup;

  // VPC作成
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    /**
     * VPC作成
     */
    this.vpc = new ec2.Vpc(this, "VPC", {
      vpcName: env.vpc.name,
      ipAddresses: ec2.IpAddresses.cidr(env.vpc.cidr),
      availabilityZones: Object.values(env.vpc.azs),
      // サブネットを個別に作成するためには明示的に空配列を指定する
      // ただし、RDSは下記で作成しないと作成できないため、RDS用サブネットだけ作る
      // cidrは自動採番
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "RDSPrivate1",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      // remove all rules from default security group
      // See: https://docs.aws.amazon.com/config/latest/developerguide/vpc-default-security-group-closed.html
      restrictDefaultSecurityGroup: true,
    });

    /**
     * インターネットゲートウェイ作成
     */
    const igw = new ec2.CfnInternetGateway(this, "InternetGateway", {});
    // VPCにアタッチ
    new ec2.CfnVPCGatewayAttachment(this, "VpcGatewayAttachment", {
      vpcId: this.vpc.vpcId,
      internetGatewayId: igw.ref,
    });

    /**
     * サブネット作成
     * 個別に作るとcidrを指定できる
     */
    this.publicSubnetAZ1 = new ec2.PublicSubnet(this, "publicSubnetAZ1", {
      vpcId: this.vpc.vpcId,
      cidrBlock: env.subnet.publicCidrAZ1,
      availabilityZone: env.vpc.azs.az1,
      mapPublicIpOnLaunch: true,
    });

    this.publicSubnetAZ2 = new ec2.PublicSubnet(this, "publicSubnetAZ2", {
      vpcId: this.vpc.vpcId,
      cidrBlock: env.subnet.publicCidrAZ2,
      availabilityZone: env.vpc.azs.az2,
      mapPublicIpOnLaunch: true,
    });

    /**
     * パブリックサブネット用にルートテーブル作成
     */
    // パブリックサブネット1用のルートテーブルの作成
    const publicRouteTable = new ec2.CfnRouteTable(this, "publicRouteTable", {
      vpcId: this.vpc.vpcId,
    });

    // ルートテーブルにインターネットゲートウェイのルート追加
    new ec2.CfnRoute(this, "publicRoute", {
      routeTableId: publicRouteTable.ref,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.ref,
    });

    // ルートテーブルとサブネット関連付け
    new ec2.CfnSubnetRouteTableAssociation(this, "SubnetRouteTableAssociation1", {
      subnetId: this.publicSubnetAZ1.subnetId,
      routeTableId: publicRouteTable.ref,
    });

    new ec2.CfnSubnetRouteTableAssociation(this, "SubnetRouteTableAssociation2", {
      subnetId: this.publicSubnetAZ2.subnetId,
      routeTableId: publicRouteTable.ref,
    });

    this.privateEC2Subnet = new ec2.PrivateSubnet(this, "privateEC2Subnet", {
      vpcId: this.vpc.vpcId,
      cidrBlock: env.subnet.privateEC2Subnet,
      availabilityZone: env.vpc.azs.az1,
      mapPublicIpOnLaunch: false,
    });
    Tags.of(this.privateEC2Subnet).add("aws-cdk:subnet-type", "Private");

    const vpcEndpointSubnet = new ec2.PrivateSubnet(this, "vpcEndpointSubnet", {
      vpcId: this.vpc.vpcId,
      cidrBlock: env.subnet.VpcEndpointSubnet,
      availabilityZone: env.vpc.azs.az1,
      mapPublicIpOnLaunch: false,
    });
    Tags.of(vpcEndpointSubnet).add("aws-cdk:subnet-type", "Private");

    /**
     * プライベート用のルート作成
     */
    const privateRouteTable = new ec2.CfnRouteTable(this, "PrivateRouteTable", {
      vpcId: this.vpc.vpcId,
    });

    new ec2.CfnSubnetRouteTableAssociation(this, "PrivateSubnetRouteTableAssociation1", {
      subnetId: this.privateEC2Subnet.subnetId,
      routeTableId: privateRouteTable.ref,
    });
    new ec2.CfnSubnetRouteTableAssociation(this, "PrivateSubnetRouteTableAssociation4", {
      subnetId: vpcEndpointSubnet.subnetId,
      routeTableId: privateRouteTable.ref,
    });

    /**
     * セキュリティグループ作成
     * 作成自体はVPCで行う。
     * 許可自体は循環依存を避けるために別スタックで行う
     */

    // EC2
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, "EC2SecurityGroup", {
      vpc: this.vpc,
      securityGroupName: env.ec2.securityGroupName,
      allowAllOutbound: false,
    });

    // ALB
    this.albSecurityGroup = new ec2.SecurityGroup(this, "ALBSecurityGroup", {
      vpc: this.vpc,
      securityGroupName: env.alb.securityGroupName,
      allowAllOutbound: false,
    });

    // RDS
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, "RDSSecurityGroup", {
      vpc: this.vpc,
      securityGroupName: env.rds.securityGroupName,
      allowAllOutbound: false,
    });

    // VPCエンドポイント
    this.vpcEndpointSecurityGroup = new ec2.SecurityGroup(this, "vpcEndpointSecurityGroup", {
      vpc: this.vpc,
      securityGroupName: env.vpcEndpoint.vpcEndpointSecurityGroupName,
      allowAllOutbound: false,
    });

    /**
     * VPCエンドポイント
     */
    this.vpc.addGatewayEndpoint("S3EndPoint", {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnets: [vpcEndpointSubnet, this.privateEC2Subnet] }],
    });

    this.vpc.addInterfaceEndpoint("SSMEndPoint", {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      securityGroups: [this.vpcEndpointSecurityGroup],
      subnets: { subnets: [vpcEndpointSubnet] },
    });

    this.vpc.addInterfaceEndpoint("SSMMESSAGEEndPoint", {
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
      securityGroups: [this.vpcEndpointSecurityGroup],
      subnets: { subnets: [vpcEndpointSubnet] },
    });

    this.vpc.addInterfaceEndpoint("EC2MESSAGEEndPoint", {
      service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
      securityGroups: [this.vpcEndpointSecurityGroup],
      subnets: { subnets: [vpcEndpointSubnet] },
    });
  }
}
