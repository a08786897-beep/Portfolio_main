const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

module.exports = asyncHandler(async (req, res, next) => {
  const authorization = req.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ success: false, message: "Admin authentication is required." });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: "Your admin session is invalid or expired." });
  }

  const user = await User.findById(payload.sub).select("_id email role tokenVersion");
  if (!user || user.role !== "admin" || payload.version !== user.tokenVersion) {
    return res.status(401).json({ success: false, message: "Your admin session is no longer valid." });
  }

  req.admin = user;
  next();
});
