const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const requireDatabase = require("../middleware/requireDatabase");
const validate = require("../middleware/validate");
const controller = require("../controllers/authController");

const router = express.Router();

router.post(
  "/login",
  body("email").trim().isEmail().withMessage("Enter a valid email address.").toLowerCase(),
  body("password").isString().isLength({ min: 1, max: 200 }).withMessage("Enter your password."),
  validate,
  requireDatabase,
  controller.login
);
router.post("/logout", auth, requireDatabase, controller.logout);

module.exports = router;
