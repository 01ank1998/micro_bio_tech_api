const logger = require("../lib/utils/logger");
const config = require("config");
const client = require("twilio")(
  config.get("twilio.accountSid"),
  config.get("twilio.authToken")
);

async function sendSms(message, to) {
  try {
    console.log(
      config.get("twilio.accountSid"),
      config.get("twilio.authToken")
    );
    await client.messages.create({
      body: message,
      from: "+17756247485",
      to: to,
    });
    logger.info("Message successfully sent to", to);
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  sendSms,
};
