const express = require("express");
const authController = require("../../controllers/auth");
const router = express.Router();

router.post("/generate-otp", authController._generateOtp);

router.post("/verify-reset-password-token", authController._verifyOtp);

module.exports = router;
