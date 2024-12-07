import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import { env } from "~/env";

// 別Stackの変数を扱えるようにする
interface SubStackProps extends StackProps {
  vpc: ec2.Vpc;
  ec2Subnet: ec2.Subnet;
  securityGroup: {
    ec2SecurityGroup: ec2.SecurityGroup;
    albSecurityGroup: ec2.SecurityGroup;
    vpcEndpointSecurityGroup: ec2.SecurityGroup;
    rdsSecurityGroup: ec2.SecurityGroup;
  };
}

export class EC2Stack extends Stack {
  // 別スタックから参照できるようにする
  public readonly ec2Instance: ec2.Instance;

  constructor(scope: Construct, id: string, props: SubStackProps) {
    super(scope, id, props);

    // 別Stackのリソース取得
    const { vpc, ec2Subnet, securityGroup } = props;

    /**
     * セキュリティグループのルール指定
     */
    // インバウンド
    securityGroup.ec2SecurityGroup.connections.allowFrom(ec2.Peer.securityGroupId(securityGroup.albSecurityGroup.securityGroupId), ec2.Port.HTTP);

    // アウトバウンド
    // エラーになる・・
    // securityGroup.ec2SecurityGroup.connections.allowTo(ec2.Peer.securityGroupId(securityGroup.rdsSecurityGroup.securityGroupId), ec2.Port.POSTGRES);

    // アウトバウンド
    securityGroup.ec2SecurityGroup.connections.allowTo(
      ec2.Peer.securityGroupId(securityGroup.vpcEndpointSecurityGroup.securityGroupId),
      ec2.Port.HTTPS,
    );

    /**
     * インスタンスプロファイル用のロール作成
     */
    const role = new iam.Role(this, "EC2InstanceSSMRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")],
    });

    // EC2を作成
    this.ec2Instance = new ec2.Instance(this, "EC2Instance", {
      vpc,
      instanceName: env.ec2.name,
      instanceType: env.ec2.instanceType,
      machineImage: env.ec2.ami,
      vpcSubnets: { subnets: [ec2Subnet] },
      securityGroup: securityGroup.ec2SecurityGroup,
      availabilityZone: env.vpc.azs.az1,
      role,
    });

    // IISをインストール
    this.ec2Instance.addUserData("Install-WindowsFeature -Name Web-Server -IncludeManagementTools", "utf-8");
  }
}
