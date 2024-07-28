import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Appconfig} from './constructs/appconfig';
import {Lambda} from './constructs/lambda';
import {FargateContainer} from './constructs/fargate-container';

export class InfraStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const application = new Appconfig(this, 'AppConfigSample');
        new Lambda(this, 'LambdaSample', {
            application: application.application,
            env: application.env,
            config: application.config,
            secretConfig: application.secretConfig,
        });
        new FargateContainer(this, 'FargateContainerSample', {
            application: application.application,
            env: application.env,
            config: application.config,
            secretConfig: application.secretConfig,
        });
    }
}
