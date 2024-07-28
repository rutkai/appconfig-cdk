import * as appconfig from 'aws-cdk-lib/aws-appconfig';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import {DockerImageAsset} from 'aws-cdk-lib/aws-ecr-assets';
import {Construct} from 'constructs';
import {ServicePrincipal} from 'aws-cdk-lib/aws-iam';

export type FargateContainerProps = {
    application: appconfig.Application;
    env: appconfig.Environment;
    config: appconfig.HostedConfiguration;
    secretConfig: appconfig.SourcedConfiguration;
};

export class FargateContainer extends Construct {
    constructor(scope: Construct, id: string, props: FargateContainerProps) {
        super(scope, id);

        const cluster = new ecs.Cluster(this, 'Cluster', {
            clusterName: 'AppConfigSample',
        });

        const taskRole = new iam.Role(this, 'ecsTaskRole', {
            roleName: 'TaskRole',
            assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
        });
        taskRole.addToPolicy(
            new iam.PolicyStatement({
                actions: [
                    'appconfig:GetConfiguration',
                    'appconfig:GetLatestConfiguration',
                    'appconfig:StartConfigurationSession',
                ],
                resources: [
                    `${props.application.applicationArn}/environment/${props.env.environmentId}/configuration/*`,
                ],
            }),
        );

        const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
            taskRole,
            runtimePlatform: {
                operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
                cpuArchitecture: ecs.CpuArchitecture.X86_64,
            },
            memoryLimitMiB: 512,
            cpu: 256,
        });

        new ecs.ContainerDefinition(this, 'backendContainer', {
            taskDefinition,
            containerName: 'AppconfigPoller',
            image: ecs.ContainerImage.fromDockerImageAsset(
                new DockerImageAsset(this, 'AppconfigPoller', {
                    directory: 'container',
                }),
            ),
            environment: {
                AWS_APPCONFIG_EXTENSION_HTTP_PORT: '2772',
                AWS_APPCONFIG_EXTENSION_POLL_INTERVAL_SECONDS: '45',
                AWS_APPCONFIG_EXTENSION_POLL_TIMEOUT_MILLIS: '3000',
                AWS_APPCONFIG_CONFIG_PATH: `applications/${props.application.applicationId}/environments/${props.env.environmentId}/configurations/${props.config.configurationProfileId}`,
                AWS_APPCONFIG_SECRET_CONFIG_PATH: `applications/${props.application.applicationId}/environments/${props.env.environmentId}/configurations/${props.secretConfig.configurationProfileId}`,
            },
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: 'AppconfigPoller',
            }),
        });
        new ecs.ContainerDefinition(this, 'appConfigAgent', {
            taskDefinition,
            containerName: 'appConfigAgent',
            image: ecs.ContainerImage.fromRegistry('public.ecr.aws/aws-appconfig/aws-appconfig-agent:2.x'),
            portMappings: [
                {
                    containerPort: 2772,
                },
            ],
            environment: {
                POLL_INTERVAL: '45',
            },
        });

        new ecs.FargateService(this, 'Service', {
            cluster,
            taskDefinition,
            desiredCount: 1,
        });
    }
}