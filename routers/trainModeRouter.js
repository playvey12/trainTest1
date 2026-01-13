const express = require("express");
const router = express.Router();
const trainList = require("../data/trainData");
const { getDaysForTrainMode } = require("./getRouter");


router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await trainList.getDaysForView(userId);
    res.render("trainMode.hbs", data);
  } catch (error) {
    console.error("Error rendering trainMode:", error);
    res.status(500).send("Server Error");
  }
});


router.get("/day/:day", getDaysForTrainMode);

module.exports = router;