const express = require("express");
const router = express.Router();
const trainList = require("../data/trainData");
const { getDays,getTrainPlanData } = require("./getRouter");
const deleteTaskById = require("./deleteRouter");
const {addTask} = require("./postRouter");
const { editTask } = require("./putRouter");
const { taskValidation, idParamValidation } = require("../middleware/validation/trainValidations");


router.get("/", getTrainPlanData )


router.delete("/delete/:id", deleteTaskById);


router.post("/add",taskValidation, addTask);


router.put("/edit/:id",idParamValidation,taskValidation, editTask);


router.get("/day/:day", getDays);

module.exports = router;