const { validationResult } = require("express-validator");
const trainList = require("../data/trainData");

async function editTask(req, res) {
  try {
     const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    const { id } = req.params;
    const dataFromClient = req.body;
    const userId = req.user.id;

    const result = await trainList.editTask(userId, id, dataFromClient);

    if (!result) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ task: result });
  } catch (error) {
    console.error("Error in editTask:", error);
    res.status(500).json({ error: error.message });
  }
}
async function editTaskForTrainMode(req, res) {
  try {
     const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    const { id } = req.params;
    const dataFromClient = req.body;
    const userId = req.user.id;

    const result = await trainList.editTaskForTrainMode(userId, id, dataFromClient);

    if (!result) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ task: result });
  } catch (error) {
    console.error("Error in editTask:", error);
    res.status(500).json({ error: error.message });
  }
}

async function editUserWeight(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    const userId = req.user.id;
    const result = await trainList.editUserWeight(userId, req.body);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  } catch (error) {
    console.error("Error in editUserWeight:", error);
    res.status(500).json({ error: "Server error" });
  }
}

async function editGoalWeight(req, res) {
  try {
     const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    const userId = req.user.id;
    const result = await trainList.editGoalWeight(userId, req.body);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  } catch (error) {
    console.error("Error in editGoalWeight:", error);
    res.status(500).json({ error: "Server error" });
  }
}

async function editStartWeight(req, res) {
  try {
     const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    const userId = req.user.id;
    const result = await trainList.editStartWeight(userId, req.body);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  } catch (error) {
    console.error("Error in editStartWeight:", error);
    res.status(500).json({ error: "Server error" });
  }
}

async function editUserName(req, res) {
  try {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const userId = req.user.id;
   
    const result = await trainList.editUserName(userId, req.body);

 
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.status(200).json(result); 
  } catch (error) {
    console.error("Error in editUserName controller:", error);
    res.status(500).json({ error: "Server error" });
  }
}

async function editUserTheme(req, res) {
  try {
     const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    const userId = req.user.id;
    const result = await trainList.editUserTheme(userId, req.body);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  } catch (error) {
    console.error("Error in editUserTheme:", error);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  editTask,
  editStartWeight,
  editUserWeight,
  editTaskForTrainMode,
  editGoalWeight,
  editUserName,
  editUserTheme
};