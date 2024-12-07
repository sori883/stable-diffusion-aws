import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { RdsStack } from "~/lib/rds-stack";
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

  const rdsStack = new RdsStack(app, "RdsStack", {
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

  const template = Template.fromStack(rdsStack).toJSON();
  expect(template).toMatchSnapshot();
});
