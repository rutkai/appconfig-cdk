import * as cdk from 'aws-cdk-lib';
import * as appconfig from 'aws-cdk-lib/aws-appconfig';
import * as sm from 'aws-cdk-lib/aws-secretsmanager';
import * as cr from 'aws-cdk-lib/custom-resources';
import {Construct} from 'constructs';

export class Appconfig extends Construct {
    public readonly application: appconfig.Application;
    public readonly env: appconfig.Environment;
    public readonly deploymentStrategy: appconfig.DeploymentStrategy;
    public readonly config: appconfig.HostedConfiguration;
    public readonly secretConfig: appconfig.SourcedConfiguration;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.application = new appconfig.Application(this, 'SampleApp');
        this.env = new appconfig.Environment(this, 'Dev', {
            application: this.application,
        });

        this.deploymentStrategy = new appconfig.DeploymentStrategy(this, 'AllAtOnce', {
            deploymentStrategyName: 'AllAtOnce',
            rolloutStrategy: {
                growthFactor: 100,
                deploymentDuration: cdk.Duration.minutes(0),
                finalBakeTime: cdk.Duration.minutes(1),
            },
        });

        this.config = new appconfig.HostedConfiguration(this, 'SampleConfig', {
            application: this.application,
            deployTo: [this.env],
            deploymentStrategy: this.deploymentStrategy,
            content: appconfig.ConfigurationContent.fromFile(__dirname + '/../../appconfig/appconfig.json'),
        });

        const secret = new sm.Secret(this, 'SampleSecret', {
            secretName: 'SampleSecret',
            secretStringValue: cdk.SecretValue.unsafePlainText(JSON.stringify({
                // It is never a good idea to store secrets in plain text in Git. You should either store it encrypted
                // or inject it from somewhere.
                secret: 'secretvalue',
            })),
        });
        const versionFetcher = this.createVersionFetchCustomResource(secret);
        this.secretConfig = new appconfig.SourcedConfiguration(this, 'SampleSecretConfig', {
            application: this.application,
            deployTo: [this.env],
            deploymentStrategy: this.deploymentStrategy,
            name: 'SecretConfig',
            location: appconfig.ConfigurationSource.fromSecret(secret),
            versionNumber: versionFetcher.getResponseField('VersionId'),
        });
        versionFetcher.node.addDependency(secret);
        this.secretConfig.node.addDependency(versionFetcher);
    }

    private createVersionFetchCustomResource(secret: sm.ISecret): cr.AwsCustomResource {
        return new cr.AwsCustomResource(this, `SecretVersion`, {
            policy: cdk.custom_resources.AwsCustomResourcePolicy.fromStatements([
                new cdk.aws_iam.PolicyStatement({
                    actions: ['secretsmanager:GetSecretValue'],
                    effect: cdk.aws_iam.Effect.ALLOW,
                    resources: [secret.secretArn],
                }),
            ]),
            onUpdate: {
                service: 'SecretsManager',
                action: 'GetSecretValue',
                parameters: {
                    SecretId: secret.secretName,
                },
                physicalResourceId: cr.PhysicalResourceId.of(Date.now().toString()),
            },
        });
    }
}
