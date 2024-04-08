import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as appconfig from 'aws-cdk-lib/aws-appconfig';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const application = new appconfig.Application(this, 'SampleApp');
    const env = new appconfig.Environment(this, 'Dev', {
      application,
    });

    const deploymentStrategy = new appconfig.DeploymentStrategy(this, 'YoloStrategy', {
      rolloutStrategy: appconfig.RolloutStrategy.ALL_AT_ONCE,
    });

    const config = new appconfig.HostedConfiguration(this, 'SampleConfig', {
      application,
      deployTo: [env],
      deploymentStrategy,
      content: appconfig.ConfigurationContent.fromFile(__dirname + '/../appconfig/appconfig.json'),
    });

    const region = cdk.region_info.RegionInfo.get(this.region);
    new lambda.Function(this, 'SampleFunction', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(__dirname + '/../lambda'),
      initialPolicy: [
        new iam.PolicyStatement({
          actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          actions: ['appconfig:GetConfiguration', 'appconfig:GetLatestConfiguration', 'appconfig:StartConfigurationSession'],
          resources: [application.applicationArn + '/*'],
        }),
      ],
      layers: [lambda.LayerVersion.fromLayerVersionArn(this, 'AppConfigLayer', region.appConfigLambdaArn('2.0.181')!)],
      environment: {
        AWS_APPCONFIG_EXTENSION_HTTP_PORT: '2772',
        AWS_APPCONFIG_EXTENSION_POLL_INTERVAL_SECONDS: '45',
        AWS_APPCONFIG_EXTENSION_POLL_TIMEOUT_MILLIS: '3000',
        AWS_APPCONFIG_CONFIG_PATH: `applications/${application.applicationId}/environments/${env.environmentId}/configurations/${config.configurationProfileId}`,
      }
    });
  }
}
