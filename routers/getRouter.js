const trainList = require("../data/trainData");

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

    res.render("trainMode.hbs", {
      ...allData,
      selectedDay: day,
      showAllDays: false,
      dayExercises: dayData.exercises,
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
module.exports = { getDays, getDaysForTrainMode,getUserData,getExerciseHistory,getUniqeExercises };