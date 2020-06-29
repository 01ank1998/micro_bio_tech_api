const Users = require("../models/user");

async function createUser(userData) {
  return await Users.create(userData, []);
}

async function findUserByPhone(phoneNumber) {
  return await Users.findOne({ phoneNumber: phoneNumber });
}

async function updateUserByPhone({ userData, phoneNumber }) {
  await Users.updateOne({ phoneNumber: phoneNumber }, { $set: userData });
  let updatedUser = await Users.findOne({ phoneNumber: user.phoneNumber });
  return updatedUser;
}

module.exports = {
  findUserByPhone,
  createUser,
  updateUserByPhone,
};
