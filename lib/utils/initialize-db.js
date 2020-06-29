const User = require("../../models/user");
const logger = require("./logger");

async function addUser() {
  try {
    let users = (await User.find({})) || [];

    if (!users || !users.length) {
      let userData = [
        {
          phoneNumber: "9999999999",
          password: "password",
        },
      ];

      let createdUsers = User.insertMany(userData);
      logger.info({
        description: "Admin User Created Successfully",
        createdUsers,
      });
    }
  } catch (error) {
    logger.error({ description: "User Creation Failed", error });
  }
}

module.exports = {
  addUser,
};
