const express = require("express");
const bcrypt  = require("bcryptjs");
const User    = require("../models/User");
const auth    = require("../middleware/auth");

const router = express.Router();

// GET /api/profile/me
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/profile/me  (update — no delete)
router.put("/me", auth, async (req, res) => {
  try {
    const { name, email, phone, company, bio, city, website,
            department, designation, employeeId,
            currentPassword, newPassword, avatar } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    // If email change — check not taken by another user
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ message: "Email already in use." });
      user.email = email;
    }

    if (name)                   user.name        = name;
    if (phone !== undefined)     user.phone       = phone;
    if (company !== undefined)   user.company     = company;
    if (bio !== undefined)       user.bio         = bio;
    if (city !== undefined)      user.city        = city;
    if (website !== undefined)   user.website     = website;
    if (department !== undefined) user.department = department;
    if (designation !== undefined) user.designation = designation;
    if (employeeId !== undefined) user.employeeId  = employeeId;
    if (avatar !== undefined)    user.avatar      = avatar;

    // Password change
    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json({ message: "Current password is required to set a new one." });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(401).json({ message: "Current password is incorrect." });
      user.password = await bcrypt.hash(newPassword, 12);
    }

    await user.save();
    const updated = await User.findById(user._id).select("-password");
    res.json({ message: "Profile updated successfully.", user: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
