const express = require("express");
const router = express.Router();
const trainList = require("../data/trainData");
const { getDaysForTrainMode,getTrainModeData } = require("./getRouter");
const { idParamValidation, taskValidationTrainMode } = require("../middleware/validation/trainValidations");
const {  editTaskForTrainMode } = require("./putRouter");

router.get("/",getTrainModeData )

router.get("/day/:day", getDaysForTrainMode);

router.put("/saveToGraph/:id", idParamValidation, taskValidationTrainMode, editTaskForTrainMode);

module.exports = router;