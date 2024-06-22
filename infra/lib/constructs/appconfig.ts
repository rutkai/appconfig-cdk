import * as cdk from 'aws-cdk-lib';
import * as appconfig from 'aws-cdk-lib/aws-appconfig';
import {Construct} from 'constructs';

export class Appconfig extends Construct {
    public readonly application: appconfig.Application;
    public readonly env: appconfig.Environment;
    public readonly deploymentStrategy: appconfig.DeploymentStrategy;
    public readonly config: appconfig.HostedConfiguration;

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
    }
}
