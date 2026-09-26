require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const bcrypt = require("bcryptjs");
const connectDatabase = require("../config/db");
const User = require("../models/User");

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12) {
    throw new Error("Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 12 characters in Backend/.env.");
  }

  await connectDatabase();
  const existing = await User.findOne({ email: email.toLowerCase() });
  const passwordHash = await bcrypt.hash(password, 12);
  if (existing) {
    existing.password = passwordHash;
    existing.tokenVersion += 1;
    await existing.save();
    console.info(`Admin password updated for ${existing.email}.`);
  } else {
    await User.create({ email, password: passwordHash, role: "admin" });
    console.info(`Admin account created for ${email}.`);
  }
}

createAdmin()
  .catch((error) => {
    console.error("Unable to create the admin account:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = require("mongoose");
    await mongoose.disconnect();
  });
