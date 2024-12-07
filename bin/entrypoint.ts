#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { env } from "~/env";
import { VpcStack } from "~/lib/vpc-stack";
import { EC2Stack } from "~/lib/ec2-stack";
import { RdsStack } from "~/lib/rds-stack";
import { AlbStack } from "~/lib/alb-stack";

const app = new cdk.App();

// VPC、セキュリティグループ、サブネット、VPCエンドポイント
const vpcStack = new VpcStack(app, "VpcStack", {
  env: {
    account: env.accountId,
    region: env.region,
  },
});

const ec2Stack = new EC2Stack(app, "EC2Stack", {
  vpc: vpcStack.vpc,
  ec2Subnet: vpcStack.privateEC2Subnet,
  securityGroup: {
    ec2SecurityGroup: vpcStack.ec2SecurityGroup,
    albSecurityGroup: vpcStack.albSecurityGroup,
    vpcEndpointSecurityGroup: vpcStack.vpcEndpointSecurityGroup,
    rdsSecurityGroup: vpcStack.rdsSecurityGroup,
  },
  env: {
    account: env.accountId,
    region: env.region,
  },
});

new AlbStack(app, "AlbStack", {
  vpc: vpcStack.vpc,
  ec2Instance: ec2Stack.ec2Instance,
  securityGroup: {
    albSecurityGroup: vpcStack.albSecurityGroup,
    ec2SecurityGroup: vpcStack.ec2SecurityGroup,
  },
  subnet: {
    publicSubnetAZ1: vpcStack.publicSubnetAZ1,
    publicSubnetAZ2: vpcStack.publicSubnetAZ2,
  },
  env: {
    account: env.accountId,
    region: env.region,
  },
});

new RdsStack(app, "RdsStack", {
  vpc: vpcStack.vpc,
  securityGroup: {
    rdsSecurityGroup: vpcStack.rdsSecurityGroup,
    ec2SecurityGroup: vpcStack.ec2SecurityGroup,
  },
  env: {
    account: env.accountId,
    region: env.region,
  },
});
