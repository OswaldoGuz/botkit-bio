// Configure AWS credentials BEFORE initializing CloudWatch Logger
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});


var botId = process.env.BOT_ID;
var botName = process.env.BOT_NAME;
const CloudWatchLogger = require('./cloudWatchLogger');

const logger = new CloudWatchLogger(`/botkit/${botName}`, `stream-${botId}`);

module.exports = logger;