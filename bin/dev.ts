#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { Vpc2Stack } from "../lib/vpc-v2-stack";
import { VpcV1Stack } from "../lib/vpc-v1-stack";

const app = new cdk.App();
new Vpc2Stack(app, "VpcStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
new VpcV1Stack(app, "VpcV1Stack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
