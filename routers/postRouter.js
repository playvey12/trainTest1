const trainList = require("../data/trainData");

async function addTask(req, res) {
  try {
    const dataFromClient = req.body;
    const userId = req.user.id;

    if (!dataFromClient.day) {
      dataFromClient.day = "Monday";
    }

    const result = await trainList.addTask(userId, dataFromClient);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in addTask:", error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = addTask;