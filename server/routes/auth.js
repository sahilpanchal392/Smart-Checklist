const express = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const crypto   = require("crypto");
const User     = require("../models/User");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/email");

const router = express.Router();

// ── Helpers ─────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

function signAccessToken(user, rememberMe = false) {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: rememberMe ? "7d" : "2h" }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + "_refresh",
    { expiresIn: "30d" }
  );
}

function getExpiryMs(rememberMe = false) {
  return rememberMe ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
}

function userPayload(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar };
}

// ── POST /api/auth/signup ───────────────────────────────────────────────────

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, company, phone, employeeId, department, designation, avatar } = req.body;

    // Input validation
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: "Name, email, password and role are required." });
    if (name.trim().length < 2)
      return res.status(400).json({ message: "Name must be at least 2 characters." });
    if (!EMAIL_RE.test(email))
      return res.status(400).json({ message: "Please enter a valid email address." });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    if (!["customer"].includes(role))
      return res.status(400).json({ message: "Employee registration is restricted. Please contact your administrator." });

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // If the user is fully verified, block re-registration
      if (existingUser.isVerified) {
        return res.status(409).json({ message: "Email already registered." });
      }
      // If unverified, allow re-registration by deleting the stale account
      // (e.g. user signed up but never verified, or was deleted from Compass)
      await User.deleteOne({ _id: existingUser._id });
    }

    const hashed = await bcrypt.hash(password, 12);
    const otp = generateOTP();

    const user = await User.create({
      name: name.trim(), email, password: hashed, role,
      company, phone, employeeId, department, designation, avatar,
      isVerified: false,
      verificationOTP: otp,
      verificationOTPExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    });

    // Send verification OTP in background without awaiting to prevent signup from hanging
    sendVerificationEmail(email, otp).catch(err => {
      console.error("Failed to send verification email in background:", err);
    });

    res.status(201).json({
      needsVerification: true,
      email: user.email,
      message: "Account created! Check your email for a verification code.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/verify-email ─────────────────────────────────────────────

router.post("/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required." });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "No account found with this email." });

    if (user.isVerified)
      return res.status(400).json({ message: "Email is already verified." });

    if (user.verificationOTP !== otp)
      return res.status(400).json({ message: "Invalid verification code." });

    if (user.verificationOTPExpiry && user.verificationOTPExpiry < new Date())
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });

    // Mark verified
    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpiry = undefined;

    // Generate tokens
    const refreshToken = signRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    const token = signAccessToken(user, false);
    const expiresIn = getExpiryMs(false);

    res.json({
      token,
      refreshToken,
      expiresIn,
      user: userPayload(user),
      message: "Email verified successfully!",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/resend-otp ───────────────────────────────────────────────

router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "No account found with this email." });

    if (user.isVerified)
      return res.status(400).json({ message: "Email is already verified." });

    const otp = generateOTP();
    user.verificationOTP = otp;
    user.verificationOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send verification OTP in background without awaiting to prevent hanging
    sendVerificationEmail(email, otp).catch(err => {
      console.error("Failed to send verification email in background:", err);
    });

    res.json({ message: "A new verification code has been sent to your email." });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/login ────────────────────────────────────────────────────

router.post("/login", async (req, res) => {
  try {
    const { email, password, role, rememberMe } = req.body;

    if (!email || !password || !role)
      return res.status(400).json({ message: "Email, password and role are required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials." });
    if (user.role !== role) return res.status(403).json({ message: `No ${role} account found with this email.` });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials." });

    // Check email verification (existing users without the field are treated as verified)
    if (user.isVerified === false) {
      return res.status(403).json({
        message: "Please verify your email before signing in.",
        needsVerification: true,
        email: user.email,
      });
    }

    // Generate tokens
    const token = signAccessToken(user, !!rememberMe);
    const refreshToken = signRefreshToken(user);
    const expiresIn = getExpiryMs(!!rememberMe);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      token,
      refreshToken,
      expiresIn,
      user: userPayload(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/refresh-token ────────────────────────────────────────────

router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token is required." });

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + "_refresh");
    } catch {
      return res.status(401).json({ message: "Invalid or expired refresh token." });
    }

    // Find user and check stored refresh token matches
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ message: "Invalid refresh token." });

    // Issue new access token (keep same refresh token)
    const rememberMe = req.body.rememberMe || false;
    const token = signAccessToken(user, rememberMe);
    const expiresIn = getExpiryMs(rememberMe);

    res.json({ token, expiresIn, user: userPayload(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/forgot-password ──────────────────────────────────────────

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email address." });
    }

    if (user.role === "employee") {
      return res.status(403).json({ message: "Employees cannot reset their password. Please contact the administrator." });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send password reset email in background without awaiting to prevent hanging
    sendPasswordResetEmail(email, resetToken).catch(err => {
      console.error("Failed to send password reset email in background:", err);
    });

    res.json({ message: "If an account exists with that email, a reset link has been sent." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/reset-password ───────────────────────────────────────────

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ message: "Token and new password are required." });

    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired reset link. Please request a new one." });

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: "Password has been reset successfully. You can now sign in." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/auth/logout ───────────────────────────────────────────────────

router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }
    res.json({ message: "Logged out successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
