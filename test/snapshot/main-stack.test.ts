import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { MainStack } from "~/lib/main-stack";
import { env } from "~/env";

test("Main Stack Snapshot Test", () => {
  const app = new cdk.App();
  const mainStack = new MainStack(app, "MainStackTest", {
    env: {
      account: env.accountId,
      region: env.region,
    },
  });
  const template = Template.fromStack(mainStack).toJSON();
  expect(template).toMatchSnapshot();
});