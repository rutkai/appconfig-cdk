const http = require('http');

exports.handler = async (event) => {
    const res = await new Promise((resolve, reject) => {
        http.get(
            "http://localhost:2772/" + process.env.AWS_APPCONFIG_CONFIG_PATH,
            resolve
        );
    });

    let configData = await new Promise((resolve, reject) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('error', err => reject(err));
        res.on('end', () => resolve(data));
    });

    const parsedConfigData = JSON.parse(configData);

    return {
        statusCode: 200,
        body: parsedConfigData,
    };
};
