const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateRefreshToken = (userId) => {
  const token = jwt.sign(
    {
      userId: userId.toString(),
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    }
  );

  return token;
};

const hashRefreshToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

module.exports = {
  generateRefreshToken,
  hashRefreshToken,
};