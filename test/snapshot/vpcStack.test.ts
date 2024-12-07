import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
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
  const template = Template.fromStack(vpcStack).toJSON();
  expect(template).toMatchSnapshot();
});
