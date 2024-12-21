import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import { generateResourceName } from "~/util";
import { baseTags, awsEnv } from "~/env";
import { ec2TrustPolicy, lambdaTrustPolicy } from "~/policy";

export class Role {
  public readonly ec2Role: iam.CfnRole;
  public readonly lambdaEc2Role: iam.CfnRole;

  constructor(scope: Construct) {
    this.ec2Role = new iam.CfnRole(scope, "EC2Role", {
      assumeRolePolicyDocument: ec2TrustPolicy,
      roleName: generateResourceName("ec2Role"),
      managedPolicyArns: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(awsEnv.ManagedPolicy.AmazonSSMManagedInstanceCore).managedPolicyArn,
        iam.ManagedPolicy.fromAwsManagedPolicyName(awsEnv.ManagedPolicy.AmazonS3FullAccess).managedPolicyArn
      ],
      tags: [
        ...baseTags,
        {key: "Name", value: generateResourceName("ec2Role")}
      ]
    });


  this.lambdaEc2Role = new iam.CfnRole(scope, "LambdaEC2Role", {
    assumeRolePolicyDocument: lambdaTrustPolicy,
    roleName: generateResourceName("lambdaEc2Role"),
    managedPolicyArns: [
      iam.ManagedPolicy.fromAwsManagedPolicyName(awsEnv.ManagedPolicy.AWSLambdaBasicExecutionRole).managedPolicyArn,
      iam.ManagedPolicy.fromAwsManagedPolicyName(awsEnv.ManagedPolicy.AmazonEC2FullAccess).managedPolicyArn,
      iam.ManagedPolicy.fromAwsManagedPolicyName(awsEnv.ManagedPolicy.AWSLambdaRole).managedPolicyArn,
    ],
    tags: [
      ...baseTags,
      {key: "Name", value: generateResourceName("lambdaEc2Role")}
    ]
  });

  }
}