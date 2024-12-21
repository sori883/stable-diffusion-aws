import { StackProps } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { generateResourceName } from "~/util";
import * as lambdaPython from "@aws-cdk/aws-lambda-python-alpha";
import * as apiGw from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { nodeEnv } from"~/env";

interface SubStackProps extends StackProps {
  lambdaRole: iam.CfnRole;
  sbEc2: ec2.CfnInstance;
}

export class Lambda {
  constructor(scope: Construct, props: SubStackProps) {

    const discord = new lambdaPython.PythonFunction(scope, "discordLambda", {
      entry: "lambda/discord",
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: "callback",
      functionName: generateResourceName("discordLambda"),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(900),
      environment: {
        DISCORD_TOKEN: nodeEnv.DISCORD_TOKEN,
        APPLICATION_ID: nodeEnv.APPLICATION_ID,
        APPLICATION_PUBLIC_KEY: nodeEnv.APPLICATION_PUBLIC_KEY!,
        COMMAND_GUILD_ID: nodeEnv.COMMAND_GUILD_ID!,
        INSTANCE_ID: props.sbEc2.attrInstanceId
      },
      role: iam.Role.fromRoleArn(scope, props.lambdaRole.roleName!, props.lambdaRole.attrArn),
    });

    // API Gatewayの作成
    const api = new apiGw.HttpApi(scope, "ApiGw", {
      apiName: generateResourceName("ApiGw"),
    });

    // Lambda統合の作成
    const lambdaIntegration = new HttpLambdaIntegration(generateResourceName("HttpIntegration"), discord);

    // ルートにGETメソッドを追加
    api.addRoutes({
      path: "/discord",
      methods: [apiGw.HttpMethod.POST],
      integration: lambdaIntegration,
    });

  }
}