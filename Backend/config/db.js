const mongoose = require("mongoose");

async function connectDatabase() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to connect to MongoDB.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(process.env.MONGO_URI);
  console.info("Connected to MongoDB.");
}

module.exports = connectDatabase;
