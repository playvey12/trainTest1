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

module.exports = { getDays, getDaysForTrainMode };