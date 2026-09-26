const mongoose = require("mongoose");

module.exports = function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState === 1) return next();

  res.status(503).json({
    success: false,
    message: "The database is temporarily unavailable. Please try again shortly.",
    error: "DATABASE_UNAVAILABLE"
  });
};
