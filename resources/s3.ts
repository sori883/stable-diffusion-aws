import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { generateResourceName } from "~/util";
import { baseTags } from "~/env";

export class S3Bucket {
  constructor(scope: Construct) {
    new s3.CfnBucket(scope, "S3Bucket", {
      bucketName: generateResourceName("s3bucket"),
      publicAccessBlockConfiguration: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      tags: [...baseTags, { key: "Name", value: generateResourceName("s3bucket") }],
    });
  }
}
