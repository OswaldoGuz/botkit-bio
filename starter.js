require("dotenv").config();

var sdk = require("./lib/sdk");
//const logger = console;
const logger = require("./lib/logger");
const foreignLinesService = require("./getForeignLines");

const botId = process.env.BOT_ID;
const botName = process.env.BOT_NAME;
// Configure AWS credentials BEFORE initializing CloudWatch Logger
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION || "us-east-1",
});

const logger = new CloudWatchLogger(`/botkit/${botName}`, `stream-${botId}`);

module.exports = {
    botId: botId,
    botName: botName,

    on_user_message: function (requestId, data, callback) {
        if (data.message === "Hi") {
            data.message = "Hello";
            //Sends back 'Hello' to user.
            return sdk.sendUserMessage(data, callback);
        } else if (!data.agent_transfer) {
            //Forward the message to bot
            return sdk.sendBotMessage(data, callback);
        } else {
            data.message = "Agent Message";
            return sdk.sendUserMessage(data, callback);
        }
    },
    on_bot_message: function (requestId, data, callback) {
        if (data.message === "hello") {
            data.message = "The Bot says hello!";
        }
        //Sends back the message to user

        return sdk.sendUserMessage(data, callback);
    },
    on_agent_transfer: function (requestId, data, callback) {
        return callback(null, data);
    },
    on_event: function (requestId, data, callback) {
        console.log("on_event -->  Event : ", data.event);
        return callback(null, data);
    },
    on_alert: function (requestId, data, callback) {
        console.log("on_alert -->  : ", data, data.message);
        return sdk.sendAlertMessage(data, callback);
    },
    on_webhook: function (requestId, data, componentName, callback) {
    if (componentName === 'HookExtranjeros') {
        const phoneNumber = data.context.phoneNumber;
        const TT = data.context.TT;

        foreignLinesService.getForeignLines({
            numeroLinea: phoneNumber,
            tt: TT
        }).then((resultado) => {
            data.context.apiSuccess = resultado.success;
            data.context.apiAccion = resultado.accion;
            data.context.apiMensaje = resultado.botMessage;

            return callback(null, data);
        }).catch((err) => {
            data.context.apiSuccess = false;
            data.context.apiMensaje = "Error en el servicio local.";
            return callback(null, data);
        });
    } else {
        
        callback(null, data);
    }
}
};
