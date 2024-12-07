import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import { env } from "~/env";

// 別Stackの変数を扱えるようにする
interface SubStackProps extends StackProps {
  vpc: ec2.Vpc;
  securityGroup: {
    rdsSecurityGroup: ec2.SecurityGroup;
    ec2SecurityGroup: ec2.SecurityGroup;
  };
}

export class RdsStack extends Stack {
  constructor(scope: Construct, id: string, props: SubStackProps) {
    super(scope, id, props);

    // 別Stackのリソース取得
    const {
      vpc,
      securityGroup,
      // subnet,
    } = props;

    /**
     * セキュリティグループ指定
     */
    securityGroup.rdsSecurityGroup.connections.allowFrom(ec2.Peer.securityGroupId(securityGroup.ec2SecurityGroup.securityGroupId), ec2.Port.POSTGRES);

    // サブネットグループ作成
    const subnetGroup = new rds.SubnetGroup(this, "RDSSubnetGroup", {
      subnetGroupName: env.rds.subnetGroupName.toLowerCase(),
      description: "aurora subnet group",
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }),
    });

    //RDS作成
    new rds.DatabaseCluster(this, "AuroraDB", {
      vpc: vpc,
      engine: env.rds.engine,
      credentials: rds.Credentials.fromGeneratedSecret("postgres"),
      defaultDatabaseName: "database1",
      deletionProtection: false,
      iamAuthentication: false,
      port: env.rds.port,
      securityGroups: [securityGroup.rdsSecurityGroup],
      removalPolicy: RemovalPolicy.DESTROY,
      subnetGroup: subnetGroup,
      clusterIdentifier: env.rds.clusterName,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      writer: rds.ClusterInstance.provisioned(env.rds.clusterName, {}),
      readers: [],
    });
  }
}
