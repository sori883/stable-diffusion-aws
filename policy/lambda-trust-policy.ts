import * as iam from "aws-cdk-lib/aws-iam";

const policy = {
  "Statement": [
      {
          "Effect": "Allow",
          "Principal": { "Service": "lambda.amazonaws.com" },
          "Action": "sts:AssumeRole"
      }
  ]
};
export const lambdaTrustPolicy = iam.PolicyDocument.fromJson(policy);