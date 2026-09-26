const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true, trim: true, maxlength: 160 },
    institution: { type: String, default: "", trim: true, maxlength: 160 },
    startDate: { type: String, default: "", trim: true, maxlength: 40 },
    endDate: { type: String, default: "", trim: true, maxlength: 40 },
    current: { type: Boolean, default: false },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Education", educationSchema);
