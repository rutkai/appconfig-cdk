exports.handler = async () => {
    const response = await fetch(`http://localhost:${process.env.AWS_APPCONFIG_EXTENSION_HTTP_PORT}/${process.env.AWS_APPCONFIG_CONFIG_PATH}`);
    const secretResponse = await fetch(`http://localhost:${process.env.AWS_APPCONFIG_EXTENSION_HTTP_PORT}/${process.env.AWS_APPCONFIG_SECRET_CONFIG_PATH}`);

    return {
        statusCode: 200,
        body: {
            configData: await response.json(),
            secretConfigData: await secretResponse.json(),
        },
    };
};
