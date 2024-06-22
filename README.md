# AppConfig with Lambda and ECS integration in CDK (TypeScript)

Based on this workshop: https://mng.workshop.aws/appconfig/narrative.html

> Note: APIGateway is not used in this example.

This stack contains the following elements:
* AppConfig sample configuration
* Lambda function that reads the AppConfig configuration
* A container that runs on Fargate and uses the AppConfig configuration
* Additional supporting resources that are required for the above (VPC, IAM roles, etc.)
