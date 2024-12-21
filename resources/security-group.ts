import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { generateResourceName } from "~/util";
import { baseTags, awsEnv } from "~/env";

interface SubStackProps extends StackProps {
  vpc: ec2.CfnVPC;
}

export class SecurityGroup {
  public readonly ec2SecurityGroup: ec2.CfnSecurityGroup;

  constructor(scope: Construct, props: SubStackProps) {
    /**
     * EC2 Security Group
     */
    this.ec2SecurityGroup = new ec2.CfnSecurityGroup(scope, "ec2SecurityGroup", {
      vpcId: props.vpc.attrVpcId,
      groupDescription: "EC2 SecurityGroup",
      groupName: generateResourceName("ec2SecurityGroup"),
      tags: [
        ...baseTags,
        {key: "Name", value: generateResourceName("ec2SecurityGroup")}
      ]
    });

    /**
     * EC2 Egress For S3 GW
     */
    new ec2.CfnSecurityGroupEgress(scope, "EC2EgressS3", {
      groupId: this.ec2SecurityGroup.attrGroupId,
      ipProtocol: "tcp",
      destinationPrefixListId: ec2.Peer.prefixList(awsEnv.managedPrefixList.s3).uniqueId,
      fromPort: 443,
      toPort: 443
    });

    /**
     * EC2 Egress For IGW
     */
    new ec2.CfnSecurityGroupEgress(scope, "EC2EgressIGW", {
      groupId: this.ec2SecurityGroup.attrGroupId,
      ipProtocol: "tcp",
      cidrIp: "0.0.0.0/0",
      fromPort: 0,
      toPort: 65535
    });

    /**
     * EC2 Ingress For Internet Stable Diffusion Port
     */
    new ec2.CfnSecurityGroupIngress(scope, "EC2IngressSB", {
      groupId: this.ec2SecurityGroup.attrGroupId,
      ipProtocol: "tcp",
      cidrIp: "0.0.0.0/0",
      fromPort: 7860,
      toPort: 7860
    });

    /**
     * EC2 Ingress For Internet Stable Diffusion Port
     */
    new ec2.CfnSecurityGroupIngress(scope, "EC2IngressSSH", {
      groupId: this.ec2SecurityGroup.attrGroupId,
      ipProtocol: "tcp",
      cidrIp: "0.0.0.0/0",
      fromPort: 22,
      toPort: 22
    });

  };
};