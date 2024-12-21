import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { generateResourceName } from "~/util";

interface SubStackProps extends StackProps {
  vpc: ec2.CfnVPC;
  routeTable: ec2.CfnRouteTable;
}

export class VpcEndpoint {
  public readonly s3Endpoint: ec2.CfnVPCEndpoint;

  constructor(scope: Construct, props: SubStackProps) {
    this.s3Endpoint = new ec2.CfnVPCEndpoint(scope, "s3endpoint", {
      serviceName: ec2.GatewayVpcEndpointAwsService.S3.name,
      vpcId: props.vpc.attrVpcId,
      vpcEndpointType: ec2.VpcEndpointType.GATEWAY,
      routeTableIds: [props.routeTable.attrRouteTableId]
    });
  }
}