const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    location: { type: String, default: "", trim: true, maxlength: 120 },
    startDate: { type: String, default: "", trim: true, maxlength: 40 },
    endDate: { type: String, default: "", trim: true, maxlength: 40 },
    current: { type: Boolean, default: false },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Experience", experienceSchema);
