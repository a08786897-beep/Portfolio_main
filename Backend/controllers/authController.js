const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

exports.login = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(req.body.password))) {
    return res.status(401).json({ success: false, message: "Email or password is incorrect." });
  }

  const token = jwt.sign(
    { sub: user.id, version: user.tokenVersion, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
  res.json({ success: true, data: { token, email: user.email } });
});

exports.logout = asyncHandler(async (req, res) => {
  req.admin.tokenVersion += 1;
  await req.admin.save();
  res.json({ success: true, message: "Admin session ended." });
});
