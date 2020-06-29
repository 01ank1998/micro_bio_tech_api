const logger = require("../lib/utils/logger");
const config = require("config");
const client = require("twilio")(
  config.get("twilio.accountSid"),
  config.get("twilio.authToken")
);

async function sendSms(message, to) {
  try {
    await client.messages.create({
      body: message,
      from: "+15017122661",
      to: to,
    });
    logger.info("Message successfully sent to", to);
  } catch (error) {
    logger.info("Message sending failed to ", to);
    throw new Error("Message Sending failed");
  }
}

module.exports = {
  sendSms,
};
