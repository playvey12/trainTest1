const trainList = require("../data/trainData");
const db = require("../data/bin/db");

async function getDays(req, res) {
  try {
    const { day } = req.params;
    const userId = req.user.id; 
    
    const dayData = await trainList.getDayData(userId, day);
    res.json(dayData);
  } catch (error) {
    console.error("Error in getDays:", error);
    res.status(500).json({ error: "Server error" });
  }
}

async function getDaysForTrainMode(req, res) {
  try {
    const { day } = req.params;
    const userId = req.user.id;

    const allData = await trainList.getDaysForView(userId);
    const dayData = await trainList.getDayData(userId, day);


    console.log(`Загрузка дня: ${day}. Найдено упражнений:`, dayData.exercises?.length);

    res.render("trainMode.hbs", {
      ...allData,
      selectedDay: day,
      isDaySelected: true, 
      dayExercises: dayData.exercises || [], // Гарантируем массив
    });
  } catch (error) {
    console.error("Error in getDaysForTrainMode:", error);
    res.status(500).send("Server Error");
  }
}
async function getUserData(req,res){
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
}
async function getExerciseHistory(req,res){ try {
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
};



async function getUniqeExercises(req,res){
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
}
async function getUserDataForProgress(req, res) {
  try {
    const userId = req.user.id;
    const profileData = await trainList.getProfileDataWithHistory(userId, '30days');
    res.json({
      userWeight: profileData.userWeight,
      userStartWeight: profileData.userStartWeight, 
      userGoalWeight: profileData.userGoalWeight,   
      profileWeightList: profileData, 
      weightHistory: profileData.weightHistory || []
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
}



const getUniqueExercises = async (req, res) => {
    try {
        const userId = req.user.id; 

      
        db.get("SELECT exercise_history FROM user_data WHERE user_id = ?", [userId], (err, row) => {
            if (err) {
                return res.status(500).json({ success: false, error: "Ошибка БД" });
            }

    
            const history = row && row.exercise_history ? JSON.parse(row.exercise_history) : [];
            
       
            const uniqueNames = [...new Set(history.map(item => item.exerciseName))].filter(Boolean);

            res.json({
                success: true,
                exercises: uniqueNames.sort() 
            });
        });
    } catch (error) {
        console.error("Ошибка при получении упражнений:", error);
        res.status(500).json({ success: false, error: "Ошибка сервера" });
    }
};


module.exports = {getUniqueExercises, getDays, getDaysForTrainMode,getUserData,getExerciseHistory,getUniqeExercises,getUserDataForProgress };