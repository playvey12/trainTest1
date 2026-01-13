const trainList = require("../data/trainData");

async function deleteTaskById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deletedTask = await trainList.deleteTaskById(userId, id);

    if (!deletedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({
      message: "Task deleted successfully",
      task: deletedTask,
    });
  } catch (error) {
    console.error("Error in deleteTaskById:", error);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = deleteTaskById;