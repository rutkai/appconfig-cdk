FROM curlimages/curl

CMD while true; do curl -s http://localhost:${AWS_APPCONFIG_EXTENSION_HTTP_PORT}/${AWS_APPCONFIG_CONFIG_PATH}; sleep 10; done
