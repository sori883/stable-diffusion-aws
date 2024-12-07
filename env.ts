import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export const env = {
  accountId: process.env.ACCOUNTID,
  region: "ap-northeast-1",
  resource: {
    prefix: "prod",
  },
  vpc: {
    name: "myvpc",
    cidr: "10.0.0.0/16",
    azs: {
      az1: "ap-northeast-1a",
      az2: "ap-northeast-1c",
    },
  },
  subnet: {
    publicCidrAZ1: "10.0.10.0/24",
    publicCidrAZ2: "10.0.11.0/24",
    privateEC2Subnet: "10.0.12.0/24",
    privateRDSSubnetAZ1: "10.0.13.0/24",
    privateRDSSubnetAZ2: "10.0.14.0/24",
    VpcEndpointSubnet: "10.0.15.0/24",
  },
  vpcEndpoint: {
    vpcEndpointSecurityGroupName: "vpcEndpointSecurityGroup",
  },
  rds: {
    clusterName: "aurora-cluster",
    engine: rds.DatabaseClusterEngine.auroraPostgres({
      version: rds.AuroraPostgresEngineVersion.VER_16_2,
    }),
    port: 5432,
    subnetGroupName: "rdsSubnetGroup",
    securityGroupName: "rdsSecurityGroup",
  },
  ec2: {
    name: "myec2",
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
    ami: ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2022_JAPANESE_FULL_BASE),
    securityGroupName: "ec2SecurityGroup",
  },
  alb: {
    name: "myalb",
    securityGroupName: "albSecurityGroup",
  },
  s3: {
    name: "alb-log-bucket-tesing-cdk-template-12223",
  },
};
