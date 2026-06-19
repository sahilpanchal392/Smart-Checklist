require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const EMPLOYEES = [
  { email: "quality@polycominnovation.com", name: "Quality Team" },
  { email: "sales@polycominnovation.com", name: "Sales Team" },
  { email: "sales2@polycominnovation.com", name: "Sales Team 2" },
  { email: "info@polycominnovation.com", name: "Info Team" }
];

const PASSWORD = "Polycom@321";

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB...");

    const hashed = await bcrypt.hash(PASSWORD, 12);

    for (const emp of EMPLOYEES) {
      const exists = await User.findOne({ email: emp.email });
      if (!exists) {
        await User.create({
          name: emp.name,
          email: emp.email,
          password: hashed,
          role: "employee",
          isVerified: true // Pre-verified
        });
        console.log(`Created: ${emp.email}`);
      } else {
        // Update password just in case it changed
        exists.password = hashed;
        exists.isVerified = true;
        await exists.save();
        console.log(`Updated: ${emp.email}`);
      }
    }

    console.log("Done seeding employees.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

seed();
