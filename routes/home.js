const express = require("express");
const router = express.Router();

const { home, dummyRoute } = require("../controllers/homeController");

router.route("/").get(home);
router.get("/dummy", dummyRoute);

module.exports = router;
