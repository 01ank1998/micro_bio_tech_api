const Users = require("../models/user");
const UserController = require("../controllers/user");
const bcrypt = require("bcrypt");
const logger = require("../lib/utils/logger");
const config = require("config");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const crypto = require("crypto");
const { sendSms } = require("./sms");

async function getToken(user) {
  const token = jwt.sign(user, config.get("jwt.secret"), {
    expiresIn: config.get("jwt.expiresIn"),
  });

  return token;
}

async function verifyToken(token) {
  return jwt.verify(token, config.get("jwt.secret"));
}

async function _preAuth(req, res, next) {
  if (
    req.path === `/${config.get("api.version")}/register-email-password` ||
    req.path === `/${config.get("api.version")}/login-by-email-password`
  ) {
    req.isAuth = false;
    return next();
  }

  const token = req.headers["authorizationtoken"];

  if (!token) {
    return res.status(401).json({
      success: false,
      statusCode: "NO_AUTH_TOKEN",
      message: "No auth token is provided",
      data: {},
    });
  }

  try {
    let user = await verifyToken(token);

    let existingUser = await UserController.findUserByEmail(user.email);

    if (!existingUser || existingUser.deleted) {
      return res.status(403).json({
        success: false,
        statusCode: "NOT_AUTHORIZED",
        message: "You are not authorized. Please contact the administrator.",
        data: {},
      });
    }

    req.user = existingUser;
    req.isAuth = true;

    next();
  } catch (error) {
    req.isAuth = false;
    logger.error({
      description: "Error in preauthentication",
      error,
      user: req.user,
    });

    return res.status(401).json({
      success: false,
      statusCode: "AUTH_TOKEN_INVALID",
      message: "Auth Token is Invalid",
      data: {},
    });
  }
}

async function _fakeAuth(req, res, next) {
  let user = await UserController.findUserByEmail("admin@dhiyo.com");
  req.user = user;
  req.isAuth = true;
  next();
}

function generateOtp() {
  let digits = "0123456789";
  let otpLength = 6;
  let otp = "";
  for (let i = 1; i <= otpLength; i++) {
    let index = Math.floor(Math.random() * digits.length);
    otp = otp + digits[index];
  }
  return otp;
}

async function _generateOtp(req, res) {
  try {
    let otp = await generateOtp();
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      throw new Error("Mobile number is required");
    }
    let user = await UserController.findUserByPhone(phoneNumber);
    if (user) {
      await Users.updateOne(
        {
          phoneNumber: phoneNumber,
        },
        {
          $set: { otp: otp },
        }
      );
    } else {
      await UserController.createUser({
        phoneNumber: phoneNumber,
        otp: otp,
      });
    }
    sendSms(`Your OTP is ${otp}`, `+91${phoneNumber}`);
  } catch (err) {
    res.json({
      success: false,
      statusCode: "GENERATE OTP FAILED",
      message: err,
    });
  }
}

async function _verifyOtp(req, res) {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
      throw new Error("Mobile number and OTP is required");
    }
    const user = await UserController.findUserByPhone(phoneNumber);
    if (user.otp === otp) {
      const user = {
        ...user,
        otp: null,
      };
      const updatedUser = await UserController.updateUserByPhone(
        user,
        phoneNumber
      );
      res.json({
        success: true,
        statusCode: "VERIFY OTP SUCCESSFULL",
        data: updatedUser,
      });
    }
  } catch (error) {
    res.json({
      success: false,
      statusCode: "VERIFY OTP FAILED",
      message: error,
    });
  }
}

module.exports = {
  _verifyOtp,
  _generateOtp,
  _preAuth,
  _fakeAuth,
};
