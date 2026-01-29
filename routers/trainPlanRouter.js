const express = require("express");
const router = express.Router();
const trainList = require("../data/trainData");
const { getDays } = require("./getRouter");
const deleteTaskById = require("./deleteRouter");
const {addTask} = require("./postRouter");
const { editTask } = require("./putRouter");
const { taskValidation, idParamValidation } = require("../middleware/validation/trainValidations");


router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
   
    const data = await trainList.getDaysForView(userId);
    res.render("trainingPlan.hbs", data);
  } catch (error) {
    console.error("Error rendering trainingPlan:", error);
    res.status(500).send("Server Error");
  }
});


router.delete("/delete/:id", deleteTaskById);


router.post("/add",taskValidation, addTask);


router.put("/edit/:id",idParamValidation,taskValidation, editTask);


router.get("/day/:day", getDays);

module.exports = router;