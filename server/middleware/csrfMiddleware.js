const { doubleCsrf } = require("csrf-csrf");

const {
  generateToken,
  doubleCsrfProtection,
  invalidCsrfTokenError,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,

  cookieName: "csrfToken",

  cookieOptions: {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  },

  size: 64,

  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
});

module.exports = {
  generateToken,
  doubleCsrfProtection,
  invalidCsrfTokenError,
};