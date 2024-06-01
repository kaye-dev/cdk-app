import { EC2Client, DescribeRouteTablesCommand } from "@aws-sdk/client-ec2";

async function work(vpcId: string) {
  const client = new EC2Client({ region: "ap-northeast-1" });

  try {
    const routeTableParams = {
      Filters: [
        {
          Name: "vpc-id",
          Values: [vpcId],
        },
      ],
    };
    const command = new DescribeRouteTablesCommand(routeTableParams);
    const data = await client.send(command);

    const mainRouteTable = data.RouteTables?.find((rt) =>
      rt.Associations?.some((assoc) => assoc.Main)
    );

    if (mainRouteTable) {
      console.log(mainRouteTable.RouteTableId);
    } else {
      console.log("Main RouteTable not found.");
    }
  } catch (error) {
    console.error("Error fetching RouteTable information:", error);
  }
}

// ハンドラー関数を呼び出す (例: VPC ID を渡す)
work("vpc-08a5830f93dbc54f7");
