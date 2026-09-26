const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);
