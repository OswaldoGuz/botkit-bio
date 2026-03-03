const AWS = require("aws-sdk");
require("dotenv").config();

class CloudWatchLogger {
    constructor() {
        this.logGroupName = process.env.CLOUDWATCH_LOG_GROUP;
        this.currentDate = this.getCurrentDateString();
        this.logStreamName = `bot-${process.env.BOT_NAME}-${this.currentDate}`;
        if (!AWS.config.credentials) {
            AWS.config.update({
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY,
                region: process.env.AWS_REGION
            });
        }
        this.cloudwatch = new AWS.CloudWatchLogs({ region: process.env.AWS_REGION });
        this.sequenceToken = null;
        this.initialized = false;
        this.initPromise = this.initialize();
    }
    getCurrentDateString() {
        const date = new Date();
        return date.toISOString().split('T')[0];
    }
    async initialize() {
        try {
            try { // crear logGroup si no existe
                await this.cloudwatch.createLogGroup({ logGroupName: this.logGroupName }).promise();
            } catch (err) {
                if (err.code !== "ResourceAlreadyExistsException") {
                    console.error("Error al crear log group:", err.message);
                }
            }
            try { // crear logStream si no existe
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
    async switchToNewDayStream(newDate) { // cambiar al nuevo logStream del día
        try {
            this.currentDate = newDate;
            this.logStreamName = `bot-${newDate}`;
            this.sequenceToken = null;
            try {
                await this.cloudwatch
                    .createLogStream({
                        logGroupName: this.logGroupName,
                        logStreamName: this.logStreamName,
                    })
                    .promise();
            } catch (err) {
                if (err.code !== "ResourceAlreadyExistsException") {
                    console.error("Error creating new log stream for new day:", err.message);
                }
            }
        } catch (err) {
            console.error("Error switching to new day stream:", err.message);
        }
    }
    async log(level, message, metadata = {}) { // función para generar bitácoras
        await this.initPromise;
        const today = this.getCurrentDateString(); // para timestamp en consola
        if (today !== this.currentDate) {
            await this.switchToNewDayStream(today);
        }
        const logMessage = {
            level,
            message,
            timestamp: new Date().toISOString(),
            ...metadata,
        };
        const consoleOutput = `[${logMessage.timestamp}] [${level}] ${message}`;
        if (Object.keys(metadata).length > 0) {
            console.log(consoleOutput, metadata);
        } else {
            console.log(consoleOutput);
        }
        if (!this.initialized) {
            return;
        }
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
    async info_sec(message, metadata = {}) {
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
    async trace(message, metadata = {}) {
        return this.log("TRACE", message, metadata);
    }
}

module.exports = CloudWatchLogger;