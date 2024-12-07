import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { AlbStack } from "~/lib/alb-stack";
import { EC2Stack } from "~/lib/ec2-stack";
import { VpcStack } from "~/lib/vpc-stack";
import { env } from "~/env";

test("VPC Stack Snapshot Test", () => {
  const app = new cdk.App();
  const vpcStack = new VpcStack(app, "TestVpcStack", {
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

  const albStack = new AlbStack(app, "AlbStack", {
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

  const template = Template.fromStack(albStack).toJSON();
  expect(template).toMatchSnapshot();
});
