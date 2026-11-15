const mongoose = require("mongoose");

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    issuer: { type: String, default: "", trim: true, maxlength: 160 },
    issueDate: { type: String, default: "", trim: true, maxlength: 40 },
    credentialUrl: { type: String, default: "", trim: true, maxlength: 2048 },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certification", certificationSchema);
