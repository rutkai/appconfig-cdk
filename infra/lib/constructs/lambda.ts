import * as appconfig from 'aws-cdk-lib/aws-appconfig';
import {Construct} from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export type LambdaProps = {
    application: appconfig.Application;
    env: appconfig.Environment;
    config: appconfig.HostedConfiguration;
};

export class Lambda extends Construct {
    constructor(scope: Construct, id: string, props: LambdaProps) {
        super(scope, id);

        const region = cdk.region_info.RegionInfo.get(cdk.Stack.of(this).region);
        new lambda.Function(this, 'SampleFunction', {
            runtime: lambda.Runtime.NODEJS_LATEST,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(__dirname + '/../../lambda'),
            initialPolicy: [
                new iam.PolicyStatement({
                    actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                    resources: ['*'],
                }),
                new iam.PolicyStatement({
                    actions: ['appconfig:GetConfiguration', 'appconfig:GetLatestConfiguration', 'appconfig:StartConfigurationSession'],
                    resources: [props.application.applicationArn + '/*'],
                }),
            ],
            layers: [lambda.LayerVersion.fromLayerVersionArn(this, 'AppConfigLayer', region.appConfigLambdaArn('2.0.181')!)],
            environment: {
                AWS_APPCONFIG_EXTENSION_HTTP_PORT: '2772',
                AWS_APPCONFIG_EXTENSION_POLL_INTERVAL_SECONDS: '45',
                AWS_APPCONFIG_EXTENSION_POLL_TIMEOUT_MILLIS: '3000',
                AWS_APPCONFIG_CONFIG_PATH: `applications/${props.application.applicationId}/environments/${props.env.environmentId}/configurations/${props.config.configurationProfileId}`,
            }
        });
    }
}
