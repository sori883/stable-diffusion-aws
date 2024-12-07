import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elb from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as targets from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import { env } from "~/env";

// 別Stackの変数を扱えるようにする
interface SubStackProps extends StackProps {
  vpc: ec2.Vpc;
  ec2Instance: ec2.Instance;
  securityGroup: {
    albSecurityGroup: ec2.SecurityGroup;
    ec2SecurityGroup: ec2.SecurityGroup;
  };
  subnet: {
    publicSubnetAZ1: ec2.Subnet;
    publicSubnetAZ2: ec2.Subnet;
  };
}

export class AlbStack extends Stack {
  constructor(scope: Construct, id: string, props: SubStackProps) {
    super(scope, id, props);

    // 別Stackのリソース取得
    const { vpc, ec2Instance, securityGroup, subnet } = props;

    /**
     * セキュリティグループルール指定
     */
    // セキュリティグループにインターネットからのhttpインバウンドを許可
    securityGroup.albSecurityGroup.connections.allowFrom(ec2.Peer.anyIpv4(), ec2.Port.HTTP);

    // セキュリティグループにEC2へのhttpアウトバウンドを許可
    securityGroup.albSecurityGroup.connections.allowTo(securityGroup.ec2SecurityGroup, ec2.Port.HTTP);

    // ALBを作成
    const alb = new elb.ApplicationLoadBalancer(this, "ALB", {
      vpc,
      internetFacing: true,
      securityGroup: securityGroup.albSecurityGroup,
      vpcSubnets: {
        subnets: [subnet.publicSubnetAZ1, subnet.publicSubnetAZ2],
      },
    });

    // ALBアクセスログ用バケットを作成
    const logBucket = new s3.Bucket(this, "LogBucket", {
      bucketName: env.s3.name,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // ALBアクセスログ設定
    alb.logAccessLogs(logBucket);

    // ALBリスナーを作成
    const albLister = alb.addListener("Listener", {
      port: 80,
      open: true,
    });

    // EC2インスタンスをターゲットに追加
    albLister.addTargets("ApplicationFleet", {
      port: 80,
      targets: [new targets.InstanceTarget(ec2Instance, 80)],
      healthCheck: {
        path: "/",
      },
    });
  }
}
