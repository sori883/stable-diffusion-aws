import * as iam from "aws-cdk-lib/aws-iam";

const policy = {
  "Statement": [
      {
          "Effect": "Allow",
          "Principal": { "Service": "ec2.amazonaws.com" },
          "Action": "sts:AssumeRole"
      }
  ]
};
export const ec2TrustPolicy = iam.PolicyDocument.fromJson(policy);