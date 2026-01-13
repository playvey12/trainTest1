const express = require("express");
const router = express.Router();
const trainList = require("../data/trainData");
const putHandlers = require("./putRouter"); // Импортируем объект с функциями


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


router.put("/edit", putHandlers.editUserWeight);
router.put("/goalWeight/edit", putHandlers.editGoalWeight);
router.put("/startWeight/edit", putHandlers.editStartWeight);

router.put("/userTheme/edit", putHandlers.editUserTheme);
router.put("/userName/edit", putHandlers.editUserName);


router.get("/userData", async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = await trainList.getProfileDataWithHistory(userId, '30days');
    res.json({
      userTheme: profileData.userTheme || 'black',
      userName: profileData.userName,
      userWeight: profileData.userWeight
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});


router.get("/exercise-history", async (req, res) => {
  try {
    const userId = req.user.id;
    const { exerciseName, period } = req.query;
    
    if (!exerciseName) {
      return res.status(400).json({ error: "Exercise name is required" });
    }
    
    const history = await trainList.getExerciseHistoryByExerciseAndPeriod(userId, exerciseName, period || '3months');
    
    res.json({
      success: true,
      exerciseName: exerciseName,
      history: history,
      period: period || '3months'
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});


router.get("/unique-exercises", async (req, res) => {
  try {
    const userId = req.user.id;
    const uniqueExercises = await trainList.getUniqueExerciseNames(userId);
    
    res.json({
      success: true,
      exercises: uniqueExercises
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});


router.post("/log-exercise", async (req, res) => {
  try {
    const userId = req.user.id;
    const { exerciseName, weight } = req.body;
    
    if (!exerciseName || weight === undefined) {
      return res.status(400).json({ error: "Exercise name and weight are required" });
    }
    
    const newEntry = await trainList.addExerciseToHistory(userId, exerciseName, weight);
    
    res.json({
      success: true,
      message: "Exercise progress logged successfully",
      entry: newEntry
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;