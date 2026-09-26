const express = require("express");
const controller = require("../controllers/publicController");
const requireDatabase = require("../middleware/requireDatabase");

const router = express.Router();

router.get("/portfolio", requireDatabase, controller.getPortfolio);
router.get("/projects", requireDatabase, controller.getProjects);

module.exports = router;
