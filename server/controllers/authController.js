
const sendEmail = require("../utils/sendEmail");
const generateVerificationToken = require("../utils/verificationToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  generateAccessToken,
} = require("../utils/generateToken");

const {
  generateRefreshToken,
  hashRefreshToken,
} = require("../utils/refreshToken");


const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded.userId).select(
      "+refreshTokenHash"
    );

    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const incomingTokenHash = hashRefreshToken(refreshToken);

    if (incomingTokenHash !== user.refreshTokenHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Store hash of the new refresh token
    user.refreshTokenHash = hashRefreshToken(newRefreshToken);

    await user.save();

    // Replace old refresh-token cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};





// ==================== REGISTER ====================
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const {
      verificationToken,
      hashedToken,
    } = generateVerificationToken();

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,

      verificationToken: hashedToken,

      verificationTokenExpires: Date.now() + 15 * 60 * 1000,
    });

    // Create verification link
    const verificationURL =
  `${process.env.SERVER_URL}/api/auth/verify-email/${verificationToken}`;

    // Send verification email
    await sendEmail({
      email: user.email,
      subject: "Verify Your Email Address",

      html: `
        <h2>Welcome ${user.name}!</h2>

        <p>Thank you for registering.</p>

        <p>Please verify your email address by clicking below:</p>

        <a href="${verificationURL}">
          Verify My Email
        </a>

        <p>This link expires in 15 minutes.</p>
      `,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while registering",
    });
  }
};

// ==================== VERIFY EMAIL ====================
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // Hash the received token
    const hashedToken = require("crypto")
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with matching token that has not expired
  const user = await User.findOne({
  verificationToken: hashedToken,
  verificationTokenExpires: { $gt: Date.now() },
}).select("+verificationToken +verificationTokenExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
      });
    }

    // Verify user email
    user.isVerified = true;

    // Clear verification token
    user.verificationToken = null;
    user.verificationTokenExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });

  } catch (error) {
    console.error("Email verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify email",
    });
  }
};






// ==================== LOGIN ====================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password +refreshTokenHash");



    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );


    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const refreshTokenHash = hashRefreshToken(refreshToken);

    user.refreshTokenHash = refreshTokenHash;
    await user.save();



res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/auth",
});



return res.status(200).json({
  success: true,
  message: "Login successful",
  accessToken,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
  },
});

  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in",
    });
  }
};









// ==================== LOGOUT ====================
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded.userId).select(
      "+refreshTokenHash"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const incomingTokenHash = hashRefreshToken(refreshToken);

    if (incomingTokenHash !== user.refreshTokenHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    user.refreshTokenHash = null;
    await user.save();

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};


// ==================== RESEND VERIFICATION EMAIL ====================
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Use a generic response to avoid revealing registered accounts
    if (!user || user.isVerified) {
      return res.status(200).json({
        success: true,
        message: "If the account requires verification, an email will be sent.",
      });
    }

    // Generate a new verification token
    const {
      verificationToken,
      hashedToken,
    } = generateVerificationToken();

    // Save new hashed token and expiry
    user.verificationToken = hashedToken;
    user.verificationTokenExpires =
      Date.now() + 15 * 60 * 1000;

    await user.save();

    // Create backend verification URL
    const verificationURL =
      `${process.env.SERVER_URL}/api/auth/verify-email/${verificationToken}`;





    // Send new verification email
    await sendEmail({
      email: user.email,
      subject: "Verify Your Email Address",

      html: `
        <h2>Hello ${user.name}!</h2>

        <p>Here is your new email verification link.</p>

        <a href="${verificationURL}">
          Verify My Email
        </a>

        <p>This link expires in 15 minutes.</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "If the account requires verification, an email will be sent.",
    });

  } catch (error) {
    console.error("Resend verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to send verification email",
    });
  }
};

// ==================== FORGOT PASSWORD ====================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user || !user.isVerified) {
      return res.status(200).json({
        success: true,
        message: "If an account exists, a password reset email will be sent.",
      });
    }

    const crypto = require("crypto");

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetURL =
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail({
      email: user.email,
      subject: "Reset Your Password",
      html: `
        <h2>Hello ${user.name}!</h2>
        <p>You requested to reset your password.</p>
        <a href="${resetURL}">Reset My Password</a>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "If an account exists, a password reset email will be sent.",
    });

  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request",
    });
  }
};


    // ==================== RESET PASSWORD ====================
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 1. Validate token
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is required",
      });
    }

    // 2. Validate new password
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // 3. Hash the token received from the reset link
    const crypto = require("crypto");

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 4. Find user with a valid, unexpired reset token
   const user = await User.findOne({
  resetPasswordToken: hashedToken,
  resetPasswordExpires: { $gt: Date.now() },
}).select(
  "+resetPasswordToken +resetPasswordExpires +refreshTokenHash"
);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link",
      });
    }

    // 5. Hash and update the new password
    user.password = await bcrypt.hash(password, 12);

    // 6. Clear reset token so it cannot be reused
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    // 7. Invalidate existing refresh-token session
    user.refreshTokenHash = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });

  } catch (error) {
    console.error("Reset password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
};


module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
};
