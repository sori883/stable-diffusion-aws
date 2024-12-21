import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { env, baseTags } from "~/env";
import { generateResourceName } from "~/util";

export class Vpc {
  public readonly vpc: ec2.CfnVPC;
  public readonly igw: ec2.CfnInternetGateway;
  public readonly routeTable: ec2.CfnRouteTable;
  public readonly ec2Subnet: ec2.CfnSubnet;

  constructor(scope: Construct) {
    /**
     * VPC
     */
    this.vpc = new ec2.CfnVPC(scope, "stdVPC", {
      cidrBlock: env.vpc.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: [...baseTags, { key: "Name", value: generateResourceName("stdVPC") }],
    });

    /**
     * IGW
     */
    this.igw = new ec2.CfnInternetGateway(scope, "stdIGW", {
      tags: [...baseTags, { key: "Name", value: generateResourceName("stdIGW") }],
    });

    /**
     * Attach IGW
     */
    new ec2.CfnVPCGatewayAttachment(scope, "VpcGatewayAttachment", {
      vpcId: this.vpc.ref,
      internetGatewayId: this.igw.ref,
    });

    /**
     * Route Table
     */
    this.routeTable = new ec2.CfnRouteTable(scope, "stdRouteTable", {
      vpcId: this.vpc.attrVpcId,
      tags: [...baseTags, { key: "Name", value: generateResourceName("stdRouteTable") }],
    });

    /**
     * Add IGW Route
     */
    new ec2.CfnRoute(scope, "addIGWRoute", {
      routeTableId: this.routeTable.attrRouteTableId,
      gatewayId: this.igw.attrInternetGatewayId,
      destinationCidrBlock: "0.0.0.0/0",
    });

    /**
     * Subnet
     */
    this.ec2Subnet = new ec2.CfnSubnet(scope, "ec2Subnet", {
      vpcId: this.vpc.attrVpcId,
      availabilityZone: env.azs["a"],
      cidrBlock: env.vpc.subnet.ec2,
      tags: [...baseTags, { key: "Name", value: generateResourceName("ec2Subnet", env.azs["a"]) }],
    });

    /**
     * Associate Subneto To RouteTable
     */
    new ec2.CfnSubnetRouteTableAssociation(scope, "associateEC2Subnet", {
      routeTableId: this.routeTable.attrRouteTableId,
      subnetId: this.ec2Subnet.attrSubnetId,
    });
  }
}
