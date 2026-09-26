const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const requireDatabase = require("../middleware/requireDatabase");
const controller = require("../controllers/submissionController");

const router = express.Router();
router.use(requireDatabase);

const validName = (field) => body(field).trim().isLength({ min: 2, max: 120 })
  .withMessage("Enter a name between 2 and 120 characters.");
const validMessage = body("message").trim().isLength({ min: 10, max: 5000 })
  .withMessage("Message must be between 10 and 5000 characters.");

router.post(
  "/contact",
  validName("fullName"),
  body("email").isEmail().withMessage("Enter a valid email address.").normalizeEmail(),
  body("phone").optional({ values: "falsy" }).isString().isLength({ max: 40 })
    .withMessage("Phone number must be 40 characters or fewer."),
  validMessage,
  validate,
  controller.createContact
);

router.post(
  "/feedback",
  validName("name"),
  body("subject").trim().isLength({ min: 3, max: 160 })
    .withMessage("Subject must be between 3 and 160 characters."),
  validMessage,
  validate,
  controller.createFeedback
);

module.exports = router;
