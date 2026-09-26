const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, default: "Development", trim: true, maxlength: 80 },
    percentage: { type: Number, min: 0, max: 100, default: 75 },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Skill", skillSchema);
