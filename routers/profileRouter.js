const express = require("express");
const router = express.Router();
const trainList = require("../data/trainData");
const { 
  editStartWeight,
  editUserWeight,
  editGoalWeight,
  editUserName,
  editUserTheme} = require("./putRouter"); 
const { weightValidation, themeValidation, userNameValidation,logExerciseValidation } = require("../middleware/validation/userValidations");
const { getUserData,getExerciseHistory,getUniqeExercises } = require("./getRouter");
const { addLogExercise } = require("./postRouter");
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const period = req.query.period || '30days';
    
 
    const profileData = await trainList.getProfileDataWithHistory(userId, period);
    const uniqueExercises = await trainList.getUniqueExerciseNames(userId);
    
    
    const exerciseHistory = await trainList.getExerciseHistoryByExerciseAndPeriod(userId, '', 'all'); 

    res.render("profileMain.hbs", {
      profileWeightList: profileData,
      weightHistory: profileData.weightHistory || [],
      exerciseHistory: exerciseHistory || [],
      uniqueExercises: uniqueExercises,
      userTheme: profileData.userTheme || 'black'
    });
  } catch (error) {
    console.error("Error rendering profile:", error);
    res.status(500).send("Server Error");
  }
});


router.put("/edit",weightValidation, editUserWeight);
router.put("/goalWeight/edit",weightValidation, editGoalWeight);
router.put("/startWeight/edit",weightValidation, editStartWeight);
router.put("/userTheme/edit",themeValidation, editUserTheme);
router.put("/userName/edit",userNameValidation, editUserName);
router.get("/userData",getUserData)
router.get("/exercise-history", getExerciseHistory )
router.get("/unique-exercises",  getUniqeExercises) 
router.post("/log-exercise",logExerciseValidation, addLogExercise )

module.exports = router;