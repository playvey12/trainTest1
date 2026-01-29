const express = require("express");
const router = express.Router();
const trainList = require("../data/trainData");
const { getDaysForTrainMode } = require("./getRouter");
const { idParamValidation, taskValidationTrainMode } = require("../middleware/validation/trainValidations");
const {  editTaskForTrainMode } = require("./putRouter");


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
router.put("/edit/:id",idParamValidation,taskValidationTrainMode, editTaskForTrainMode);

module.exports = router;