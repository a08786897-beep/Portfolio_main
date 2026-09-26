const Contact = require("../models/Contact");
const Feedback = require("../models/Feedback");
const asyncHandler = require("../utils/asyncHandler");

exports.createContact = asyncHandler(async (req, res) => {
  const contact = await Contact.create({
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone || "",
    message: req.body.message
  });
  res.status(201).json({
    success: true,
    message: "Your message has been sent.",
    data: { id: contact.id }
  });
});

exports.createFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.create({
    name: req.body.name,
    subject: req.body.subject,
    message: req.body.message
  });
  res.status(201).json({
    success: true,
    message: "Thank you. Your feedback has been received.",
    data: { id: feedback.id }
  });
});
