const express = require("express");
const router = express.Router();
const { addLogExercise } = require("./postRouter");
const {  editGoalWeight, editStartWeight} = require("./putRouter"); 
const { editUserWeight } = require("./putRouter");
const { getExerciseHistory,getUserDataForProgress,getUniqueExercises } = require("./getRouter");
const { weightValidation, logExerciseValidation } = require("../middleware/validation/userValidations");

router.get("/", (req, res) => {

    res.render("progressMain", { 
        title: "Прогресс"
    });
});
router.get("/unique-exercises", getUniqueExercises);
router.put("/edit",  weightValidation, editUserWeight);
router.put("/goalWeight/edit",weightValidation, editGoalWeight);
router.put("/startWeight/edit",weightValidation, editStartWeight);
router.post("/log-exercise",logExerciseValidation, addLogExercise )
router.get("/exercise-history", getExerciseHistory )
router.get("/userData",getUserDataForProgress)

module.exports = router;