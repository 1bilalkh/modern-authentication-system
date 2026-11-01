const express = require("express");

const {
  register,
  login,
  refreshAccessToken,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { doubleCsrfProtection } = require("../middleware/csrfMiddleware");

const {
  loginLimiter,
  passwordResetLimiter,
  verificationLimiter,
} = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/register", register);
router.post("/login", loginLimiter, login);

router.get("/verify-email/:token", verifyEmail);

router.post(
  "/resend-verification",
  verificationLimiter,
  resendVerificationEmail
);

router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password/:token", passwordResetLimiter, resetPassword);
router.post("/logout", doubleCsrfProtection, logout);
router.post(
  "/refresh",
  (req, res, next) => {
    console.log("CSRF MIDDLEWARE REACHED");
    next();
  },
  doubleCsrfProtection,
  refreshAccessToken
);
module.exports = router;