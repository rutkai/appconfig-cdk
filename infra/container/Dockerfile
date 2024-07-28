FROM curlimages/curl

CMD while true; do echo "Config:"; curl -s http://localhost:${AWS_APPCONFIG_EXTENSION_HTTP_PORT}/${AWS_APPCONFIG_CONFIG_PATH}; echo "SecretConfig:"; curl -s http://localhost:${AWS_APPCONFIG_EXTENSION_HTTP_PORT}/${AWS_APPCONFIG_SECRET_CONFIG_PATH}; sleep 10; done
