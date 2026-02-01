const express = require("express");
const router = express.Router();

const trainList = require("../data/trainData");
const { 
  editUserWeight,
  editUserName,
  editUserTheme,editTgUserName,avatarEdit} = require("./putRouter"); 
const { weightValidation, themeValidation, userNameValidation } = require("../middleware/validation/userValidations");
const { getUserData,getUniqeExercises } = require("./getRouter");
const { upload } = require("../data/bin/FileMenager");

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
router.put("/userTheme/edit",themeValidation, editUserTheme);
router.put("/userName/edit",userNameValidation, editUserName);
router.put("/tgUserName/edit", editTgUserName);
router.put("/avatar/edit",upload.single('avatar'), avatarEdit);


router.get("/userData",getUserData)
router.get("/unique-exercises",  getUniqeExercises) 

// Примерный код для твоего контроллера на сервере
router.post('/updateStats', async (req, res) => {
    const { addWorkout, hoursToAdd } = req.body;
    const userId = req.user.id; 

    try {
        // Вызываем функцию, которую создали выше
        const updatedStats = await trainList.updateProfileStats(userId, {
            addWorkout,
            hoursToAdd
        });

        res.json({ 
            success: true, 
            stats: updatedStats 
        });
    } catch (e) {
        console.error("Ошибка при обновлении статистики:", e);
        res.status(500).json({ error: "Ошибка сервера при сохранении статистики" });
    }
});
module.exports = router;