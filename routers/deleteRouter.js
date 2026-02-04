const db = require("../data/bin/db");
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



async function deleteUser(req, res) {

{
   const userId = req.user.id;
    console.log("Попытка удаления аккаунта для ID:", userId);

    // Используем простой запрос, чтобы проверить, нет ли конфликтов
    // Если у вас нет таблиц workouts/progress, этот код не упадет
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Пытаемся удалить данные из связанных таблиц (обернуты в обработку, чтобы не падать)
        const tables = ['workouts', 'progress', 'user_settings']; // добавьте сюда свои таблицы
        
        tables.forEach(table => {
            db.run(`DELETE FROM ${table} WHERE user_id = ?`, [userId], (err) => {
                if (err) console.log(`Заметка: Таблица ${table} не затронута или не существует`);
            });
        });

        // Главное удаление пользователя
        db.run("DELETE FROM users WHERE id = ?", [userId], function(err) {
            if (err) {
                console.error("ОШИБКА БД:", err.message);
                db.run("ROLLBACK");
                return res.status(500).json({ error: "Ошибка базы данных при удалении" });
            }

            if (this.changes === 0) {
                db.run("ROLLBACK");
                return res.status(404).json({ error: "Пользователь не найден" });
            }

            db.run("COMMIT");
            console.log("Аккаунт успешно удален из БД");
            res.json({ message: "Аккаунт успешно удален" });
        });
    });
}
}
module.exports = {deleteTaskById,deleteUser};