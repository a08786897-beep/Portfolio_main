const express = require("express");
const { body, param } = require("express-validator");
const auth = require("../middleware/auth");
const requireDatabase = require("../middleware/requireDatabase");
const validate = require("../middleware/validate");
const controller = require("../controllers/adminController");
const Project = require("../models/Project");
const Skill = require("../models/Skill");
const Experience = require("../models/Experience");
const Education = require("../models/Education");
const Service = require("../models/Service");

const router = express.Router();
router.use(auth);
router.use(requireDatabase);

function idParam() {
  return param("id").isMongoId().withMessage("Record ID is invalid.");
}

const stringField = (name, options = {}) => {
  let rule = body(name);
  if (options.optional) rule = rule.optional({ checkFalsy: true });
  if (options.trim !== false) rule = rule.trim();
  return rule.isLength({
    min: options.min || 0,
    max: options.max || 2000
  }).withMessage(`${name} has an invalid length.`);
};

const urlField = (name) => body(name).optional({ checkFalsy: true }).isURL({
  protocols: ["http", "https"],
  require_protocol: true
}).withMessage(`${name} must be a valid http or https URL.`);

const orderField = () => body("order").optional().isInt({ min: 0, max: 100000 }).toInt()
  .withMessage("Order must be a non-negative integer.");

function registerResource(path, Model, fields, validators) {
  const handlers = controller.resourceHandlers(Model, fields);
  router.route(`/${path}`)
    .get(handlers.list)
    .post(...validators(false), validate, handlers.create);
  router.route(`/${path}/:id`)
    .put(idParam(), ...validators(true), validate, handlers.update)
    .delete(idParam(), validate, handlers.remove);
}

registerResource("projects", Project,
  ["title", "description", "technologies", "image", "githubUrl", "liveDemoUrl", "category", "order"],
  (optional) => [
    stringField("title", { min: 2, max: 120, optional }),
    stringField("description", { min: 10, max: 2000, optional }),
    body("technologies").optional().isArray().withMessage("Technologies must be a list."),
    body("technologies.*").optional().isString().isLength({ max: 60 }),
    urlField("image"),
    urlField("githubUrl"),
    urlField("liveDemoUrl"),
    stringField("category", { optional: true, max: 80 }),
    orderField()
  ]);

registerResource("skills", Skill,
  ["name", "category", "percentage", "order"],
  (optional) => [
    stringField("name", { min: 1, max: 80, optional }),
    stringField("category", { optional: true, max: 80 }),
    body("percentage").optional().isInt({ min: 0, max: 100 }).toInt()
      .withMessage("Percentage must be between 0 and 100."),
    orderField()
  ]);

registerResource("experience", Experience,
  ["title", "company", "location", "startDate", "endDate", "current", "description", "order"],
  (optional) => [
    stringField("title", { min: 2, max: 120, optional }),
    stringField("company", { min: 1, max: 120, optional }),
    stringField("location", { optional: true, max: 120 }),
    stringField("startDate", { optional: true, max: 40 }),
    stringField("endDate", { optional: true, max: 40 }),
    body("current").optional().isBoolean().toBoolean(),
    stringField("description", { optional: true, max: 2000 }),
    orderField()
  ]);

registerResource("education", Education,
  ["degree", "institution", "startDate", "endDate", "current", "description", "order"],
  (optional) => [
    stringField("degree", { min: 2, max: 160, optional }),
    stringField("institution", { min: 2, max: 160, optional }),
    stringField("startDate", { optional: true, max: 40 }),
    stringField("endDate", { optional: true, max: 40 }),
    body("current").optional().isBoolean().toBoolean(),
    stringField("description", { optional: true, max: 2000 }),
    orderField()
  ]);

registerResource("services", Service,
  ["title", "description", "order"],
  (optional) => [
    stringField("title", { min: 2, max: 120, optional }),
    stringField("description", { min: 10, max: 1000, optional }),
    orderField()
  ]);

router.get("/messages", controller.listMessages);
router.patch(
  "/messages/:id",
  idParam(),
  body("read").isBoolean().toBoolean().withMessage("Read must be true or false."),
  validate,
  controller.updateMessage
);
router.delete("/messages/:id", idParam(), validate, controller.deleteMessage);
router.get("/feedback", controller.listFeedback);
router.delete("/feedback/:id", idParam(), validate, controller.deleteFeedback);
router.get("/profile", controller.getProfile);
router.patch(
  "/profile",
  stringField("name", { optional: true, max: 120 }),
  stringField("headline", { optional: true, max: 200 }),
  stringField("subtitle", { optional: true, max: 500 }),
  stringField("about", { optional: true, max: 3000 }),
  body("email").optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  stringField("phone", { optional: true, max: 40 }),
  stringField("location", { optional: true, max: 120 }),
  urlField("resumeUrl"),
  validate,
  controller.updateProfile
);

module.exports = router;
