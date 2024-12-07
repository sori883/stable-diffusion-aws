import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
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

  const ec2Stack = new EC2Stack(app, "TestEC2Stack", {
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
  const template = Template.fromStack(ec2Stack).toJSON();
  expect(template).toMatchSnapshot();
});
