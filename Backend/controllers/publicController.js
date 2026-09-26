const Project = require("../models/Project");
const Skill = require("../models/Skill");
const Experience = require("../models/Experience");
const Education = require("../models/Education");
const Service = require("../models/Service");
const Profile = require("../models/Profile");
const asyncHandler = require("../utils/asyncHandler");

exports.getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find().sort({ order: 1, createdAt: -1 }).lean();
  res.json({ success: true, data: projects });
});

exports.getPortfolio = asyncHandler(async (req, res) => {
  const [profile, skills, experience, education, services] = await Promise.all([
    Profile.findOne().lean(),
    Skill.find().sort({ order: 1, createdAt: 1 }).lean(),
    Experience.find().sort({ order: 1, createdAt: -1 }).lean(),
    Education.find().sort({ order: 1, createdAt: -1 }).lean(),
    Service.find().sort({ order: 1, createdAt: 1 }).lean()
  ]);
  res.json({ success: true, data: { profile, skills, experience, education, services } });
});
