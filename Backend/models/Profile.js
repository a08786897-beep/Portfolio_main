const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true, maxlength: 120 },
    headline: { type: String, default: "", trim: true, maxlength: 200 },
    subtitle: { type: String, default: "", trim: true, maxlength: 500 },
    about: { type: String, default: "", trim: true, maxlength: 3000 },
    email: { type: String, default: "", trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    location: { type: String, default: "", trim: true, maxlength: 120 },
    resumeUrl: { type: String, default: "", trim: true },
    socialLinks: {
      type: [{ label: String, url: String }],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
