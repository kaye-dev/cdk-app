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

    // Lambda IAM Role
    const lambdaIamRole = new iam.Role(this, "LambdaIAMRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      inlinePolicies: {
        root: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ["ec2:DescribeRouteTables", "ec2:CreateRoute"],
              resources: ["*"],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              resources: ["arn:aws:logs:*:*:*"],
            }),
          ],
        }),
      },
    });

    // Lambda Function
    const lambdaFunction = new lambda.Function(this, "LambdaFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
        const { EC2Client, DescribeRouteTablesCommand, CreateRouteCommand } = require("@aws-sdk/client-ec2");

        exports.handler = async function(event, context) {
          const ec2 = new EC2Client({ region: "ap-northeast-1" });
          const vpcId = event.ResourceProperties.VpcId;
          const igwId = event.ResourceProperties.IgwId;

          try {
            // Describe route tables
            const routeTableParams = {
              Filters: [
                {
                  Name: "vpc-id",
                  Values: [vpcId],
                },
              ],
            };
            const describeCommand = new DescribeRouteTablesCommand(routeTableParams);
            const data = await ec2.send(describeCommand);

            const mainRouteTable = data.RouteTables.find((rt) =>
              rt.Associations.some((assoc) => assoc.Main)
            );

            if (mainRouteTable) {
              const routeTableId = mainRouteTable.RouteTableId;

              // Create route
              const createRouteParams = {
                RouteTableId: routeTableId,
                DestinationCidrBlock: "0.0.0.0/0",
                GatewayId: igwId,
              };
              const createRouteCommand = new CreateRouteCommand(createRouteParams);
              await ec2.send(createRouteCommand);

              return {
                PhysicalResourceId: routeTableId,
                Data: { RouteTableId: routeTableId },
              };
            } else {
              throw new Error("Main route table not found.");
            }
          } catch (error) {
            console.error(error);
            throw error;
          }
        };
      `),
      role: lambdaIamRole,
    });

    // Custom Resource Provider
    const provider = new cr.Provider(this, "Provider", {
      onEventHandler: lambdaFunction,
    });

    // Custom Resource
    new cdk.CustomResource(this, "CustomResource", {
      serviceToken: provider.serviceToken,
      properties: {
        VpcId: vpc.vpcId,
        IgwId: igw.ref,
      },
    });
  }
}
