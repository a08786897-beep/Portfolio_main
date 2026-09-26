const Contact = require("../models/Contact");
const Feedback = require("../models/Feedback");
const Profile = require("../models/Profile");
const asyncHandler = require("../utils/asyncHandler");

exports.listMessages = asyncHandler(async (req, res) => {
  const messages = await Contact.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json({ success: true, data: messages });
});

exports.updateMessage = asyncHandler(async (req, res) => {
  const message = await Contact.findByIdAndUpdate(
    req.params.id,
    { read: req.body.read },
    { new: true, runValidators: true }
  );
  if (!message) return res.status(404).json({ success: false, message: "Message not found." });
  res.json({ success: true, data: message });
});

exports.deleteMessage = asyncHandler(async (req, res) => {
  const message = await Contact.findByIdAndDelete(req.params.id);
  if (!message) return res.status(404).json({ success: false, message: "Message not found." });
  res.status(204).end();
});

exports.listFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json({ success: true, data: feedback });
});

exports.deleteFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findByIdAndDelete(req.params.id);
  if (!feedback) return res.status(404).json({ success: false, message: "Feedback not found." });
  res.status(204).end();
});

exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne().lean();
  res.json({ success: true, data: profile });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const fields = ["name", "headline", "subtitle", "about", "email", "phone", "location", "resumeUrl"];
  const updates = Object.fromEntries(fields
    .filter((field) => req.body[field] !== undefined)
    .map((field) => [field, req.body[field]]));
  const profile = await Profile.findOneAndUpdate({}, { $set: updates }, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true
  });
  res.json({ success: true, data: profile });
});

exports.resourceHandlers = function resourceHandlers(Model, fields) {
  const pickFields = (body) => Object.fromEntries(
    fields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]])
  );

  return {
    list: asyncHandler(async (req, res) => {
      const items = await Model.find().sort({ order: 1, createdAt: -1 }).lean();
      res.json({ success: true, data: items });
    }),
    create: asyncHandler(async (req, res) => {
      const item = await Model.create(pickFields(req.body));
      res.status(201).json({ success: true, data: item });
    }),
    update: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndUpdate(req.params.id, { $set: pickFields(req.body) }, {
        new: true,
        runValidators: true
      });
      if (!item) return res.status(404).json({ success: false, message: "Record not found." });
      res.json({ success: true, data: item });
    }),
    remove: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: "Record not found." });
      res.status(204).end();
    })
  };
};
