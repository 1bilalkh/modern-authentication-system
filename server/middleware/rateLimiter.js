const rateLimit = require("express-rate-limit");

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    success: false,
    message: "Too many password reset requests. Please try again later.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Email verification rate limiter
const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    success: false,
    message: "Too many verification requests. Please try again later.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  passwordResetLimiter,
  verificationLimiter,
};