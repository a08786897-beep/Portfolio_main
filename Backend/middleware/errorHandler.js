module.exports = function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ success: false, message: "The submitted data is invalid." });
  }
  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: "A record with that value already exists." });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    success: false,
    message: status >= 500 ? "An unexpected server error occurred." : error.message
  });
};
