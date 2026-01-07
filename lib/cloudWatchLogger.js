const AWS = require("aws-sdk");
require("dotenv").config();

class CloudWatchLogger {
    constructor(logGroupName = "/botkit", logStreamName = null) {
        this.logGroupName = logGroupName;
        this.logStreamName = logStreamName || `bot-${Date.now()}`;

        // Asegurarse que están las credenciales de AWS
        if (!AWS.config.credentials) {
            AWS.config.update({
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY,
                region: process.env.AWS_REGION || "us-east-1",
            });
        }

        this.cloudwatch = new AWS.CloudWatchLogs({ region: process.env.AWS_REGION || "us-east-1" });
        this.sequenceToken = null;
        this.initialized = false;
        this.initPromise = this.initialize();
    }

    async initialize() {
        try {
            // Crear loggroup si no existe
            try {
                await this.cloudwatch.createLogGroup({ logGroupName: this.logGroupName }).promise();
            } catch (err) {
                if (err.code !== "ResourceAlreadyExistsException") {
                    console.error("Error al crear log group:", err.message);
                }
            }

            // Crear logstream si no existe
            try {
                await this.cloudwatch
                    .createLogStream({
                        logGroupName: this.logGroupName,
                        logStreamName: this.logStreamName,
                    })
                    .promise();
            } catch (err) {
                if (err.code !== "ResourceAlreadyExistsException") {
                    console.error("Error al crear log stream:", err.message);
                }
            }

            this.initialized = true;
        } catch (err) {
            console.error("CloudWatch logger initialization error:", err.message);
        }
    }

    async log(level, message, metadata = {}) {
        await this.initPromise;

        if (!this.initialized) {
            console.log(`[${level}] ${message}`, metadata);
            return;
        }

        const logMessage = {
            level,
            message,
            timestamp: new Date().toISOString(),
            ...metadata,
        };

        try {
            const params = {
                logGroupName: this.logGroupName,
                logStreamName: this.logStreamName,
                logEvents: [
                    {
                        message: JSON.stringify(logMessage),
                        timestamp: Date.now(),
                    },
                ],
            };

            if (this.sequenceToken) {
                params.sequenceToken = this.sequenceToken;
            }

            const response = await this.cloudwatch.putLogEvents(params).promise();
            this.sequenceToken = response.nextSequenceToken;
        } catch (err) {
            console.error("Error al enviar bitácora a CloudWatch:", err.message);
            if (err.code === "InvalidSequenceTokenException") {
                this.sequenceToken = null;
            }
        }
    }

    async info(message, metadata = {}) {
        return this.log("INFO", message, metadata);
    }

    async error(message, metadata = {}) {
        return this.log("ERROR", message, metadata);
    }

    async warn(message, metadata = {}) {
        return this.log("WARN", message, metadata);
    }

    async debug(message, metadata = {}) {
        return this.log("DEBUG", message, metadata);
    }
}

module.exports = CloudWatchLogger;
