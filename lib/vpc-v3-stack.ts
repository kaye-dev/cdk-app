import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_lambda as lambda,
  custom_resources as cr,
} from "aws-cdk-lib";

export class Vpc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, "cdk-dev-vpc", {
      cidr: "10.0.0.0/16",
      vpcName: "cdk-dev-vpc",
      subnetConfiguration: [],
    });

    new ec2.CfnSubnet(this, "cdk-dev-public-subnet-subnet-01", {
      availabilityZone: "ap-northeast-1a",
      cidrBlock: "10.0.0.0/24",
      vpcId: vpc.vpcId,
      tags: [{ key: "Name", value: "cdk-dev-public-subnet-subnet-01" }],
    });

    new ec2.CfnSubnet(this, "cdk-dev-public-subnet-subnet-02", {
      availabilityZone: "ap-northeast-1c",
      cidrBlock: "10.0.1.0/24",
      vpcId: vpc.vpcId,
      tags: [{ key: "Name", value: "cdk-dev-public-subnet-subnet-02" }],
    });

    new ec2.CfnSubnet(this, "cdk-dev-public-subnet-subnet-03", {
      availabilityZone: "ap-northeast-1d",
      cidrBlock: "10.0.2.0/24",
      vpcId: vpc.vpcId,
      tags: [{ key: "Name", value: "cdk-dev-public-subnet-subnet-02" }],
    });

    // Internet Gateway
    const igw = new ec2.CfnInternetGateway(this, "IGW", {
      tags: [{ key: "Name", value: "cdk-dev-igw" }],
    });

    new ec2.CfnVPCGatewayAttachment(this, "IGWA", {
      vpcId: vpc.vpcId,
      internetGatewayId: igw.ref,
    });

    /** 実現したいこと:
     * cdk-dev-public-subnet-subnet-01
     * cdk-dev-public-subnet-subnet-02
     * cdk-dev-public-subnet-subnet-03
     * 上記のサブネットは VPC 作成時に自動で作成されるメインのルートテーブルに関連づけられるのですが、
     * そのメインのルートテーブル名を任意の名前に変更しつつ、メインのルートテーブルのルートに igw を追加したいです。
     */
  }
}
