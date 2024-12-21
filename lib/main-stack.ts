import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Vpc } from "~/resources/vpc";
import { VpcEndpoint } from "~/resources/vpc-endpoint";
import { SecurityGroup } from "~/resources/security-group"
import { Role } from "~/resources/role";
import { Ec2 } from "~/resources/ec2";
import { Lambda } from "~/resources/lambda"
import { S3Bucket } from "~/resources/s3";

export class MainStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    
    const vpc = new Vpc(this);

    const sg = new SecurityGroup(this, {
      vpc: vpc.vpc,
    });
    
    new VpcEndpoint(this, {
      vpc: vpc.vpc,
      routeTable: vpc.routeTable,
    });

    const role = new Role(this);

    const ec2 = new Ec2(this, {
      ec2Subnet: vpc.ec2Subnet,
      ec2SecurityGroup: sg.ec2SecurityGroup,
      ec2Role: role.ec2Role,
    });

    new Lambda(this, {
      lambdaRole: role.lambdaEc2Role,
      sbEc2: ec2.ec2
    });

    new S3Bucket(this);

  }
}