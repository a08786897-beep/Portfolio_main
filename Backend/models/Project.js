const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    technologies: { type: [String], default: [] },
    image: { type: String, default: "", trim: true },
    githubUrl: { type: String, default: "", trim: true },
    liveDemoUrl: { type: String, default: "", trim: true },
    category: { type: String, default: "Web Development", trim: true, maxlength: 80 },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
