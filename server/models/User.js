const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ["customer", "employee"], required: true },
  // Customer-specific
  company:     { type: String },
  phone:       { type: String },
  // Employee-specific
  employeeId:  { type: String },
  department:  { type: String },
  designation: { type: String },
  // Profile
  avatar:      { type: String },   // base64 or URL
  bio:         { type: String },
  city:        { type: String },
  website:     { type: String },
  // Email verification
  isVerified:          { type: Boolean, default: false },
  verificationOTP:     { type: String },
  verificationOTPExpiry: { type: Date },
  // Password reset
  resetPasswordToken:  { type: String },
  resetPasswordExpiry: { type: Date },
  // Refresh token
  refreshToken:        { type: String },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
