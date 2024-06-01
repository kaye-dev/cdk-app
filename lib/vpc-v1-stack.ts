import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_ec2 as ec2 } from "aws-cdk-lib";

export class VpcV1Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "cdk-dev-vpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      vpcName: "cdk-dev-vpc",
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "cdk-dev-public-subnet",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "cdk-dev-private-subnet",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // 明示的にサブネット名を設定
    vpc.publicSubnets.forEach((subnet, index) => {
      const subnetName = `cdk-dev-public-subnet-subnet${index + 1}`;
      cdk.Tags.of(subnet).add("Name", subnetName);
      new cdk.CfnOutput(this, subnetName, {
        value: subnet.subnetId,
        description: `Public Subnet ${index + 1}`,
      });

      const cfnRouteTable = subnet.node.findChild(
        "RouteTable"
      ) as ec2.CfnRouteTable;
      cdk.Tags.of(cfnRouteTable).add("Name", `cdk-dev-public-rtb${index + 1}`);
    });

    vpc.privateSubnets.forEach((subnet, index) => {
      const subnetName = `cdk-dev-private-subnet-subnet${index + 1}`;
      cdk.Tags.of(subnet).add("Name", subnetName);
      new cdk.CfnOutput(this, subnetName, {
        value: subnet.subnetId,
        description: `Private Subnet ${index + 1}`,
      });

      const cfnRouteTable = subnet.node.findChild(
        "RouteTable"
      ) as ec2.CfnRouteTable;
      cdk.Tags.of(cfnRouteTable).add("Name", `cdk-dev-private-rtb${index + 1}`);
    });
  }
}
