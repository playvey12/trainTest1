const db = require("./data/bin/db"); 

// 1. История веса тела (оставляем без изменений)
const weightData = [
    {"id":101,"weight":65.0,"date":"2026-01-25T10:00:00.000Z","timestamp":1769306400000},
    {"id":102,"weight":66.2,"date":"2026-01-26T10:00:00.000Z","timestamp":1769392800000},
    {"id":103,"weight":65.8,"date":"2026-01-27T10:00:00.000Z","timestamp":1769479200000},
    {"id":104,"weight":67.5,"date":"2026-01-28T10:00:00.000Z","timestamp":1769565600000},
    {"id":105,"weight":68.1,"date":"2026-01-29T10:00:00.000Z","timestamp":1769652000000},
    {"id":106,"weight":70.4,"date":"2026-01-30T10:00:00.000Z","timestamp":1769738400000},
    {"id":107,"weight":72.5,"date":"2026-01-31T10:00:00.000Z","timestamp":1769824800000}
];

// 2. План тренировок (ВЕСА ХРАНЯТСЯ ЧЕРЕЗ ЗАПЯТУЮ СОГЛАСНО КОЛИЧЕСТВУ ПОДХОДОВ)
const trainData = {
    "Monday": [
        { "id": "Mon_1", "exerciseName": "Жим штанги лежа", "weight": "70, 70, 75, 75", "approaches": 4, "dayRussian": "Понедельник" },
        { "id": "Mon_2", "exerciseName": "Жим гантелей под углом", "weight": "24, 24, 24", "approaches": 3, "dayRussian": "Понедельник" },
        { "id": "Mon_3", "exerciseName": "Разведение гантелей", "weight": "14, 14, 14", "approaches": 3, "dayRussian": "Понедельник" },
        { "id": "Mon_4", "exerciseName": "Армейский жим", "weight": "40, 40, 40", "approaches": 3, "dayRussian": "Понедельник" },
        { "id": "Mon_5", "exerciseName": "Махи в стороны", "weight": "10, 10, 12, 12", "approaches": 4, "dayRussian": "Понедельник" },
        { "id": "Mon_6", "exerciseName": "Отжимания на брусьях", "weight": "15, 15, 15", "approaches": 3, "dayRussian": "Понедельник" },
        { "id": "Mon_7", "exerciseName": "Французский жим", "weight": "30, 30, 30", "approaches": 3, "dayRussian": "Понедельник" },
        { "id": "Mon_8", "exerciseName": "Разгибания на блоке", "weight": "25, 25, 30, 30", "approaches": 4, "dayRussian": "Понедельник" },
        { "id": "Mon_9", "exerciseName": "Жим книзу одной рукой", "weight": "10, 10, 10", "approaches": 3, "dayRussian": "Понедельник" },
        { "id": "Mon_10", "exerciseName": "Планка", "weight": "0, 0, 0", "approaches": 3, "dayRussian": "Понедельник" }
    ],
    "Wednesday": [
        { "id": "Wed_1", "exerciseName": "Становая тяга", "weight": "100, 110, 120", "approaches": 3, "dayRussian": "Среда" },
        { "id": "Wed_2", "exerciseName": "Подтягивания", "weight": "10, 10, 10, 10", "approaches": 4, "dayRussian": "Среда" },
        { "id": "Wed_3", "exerciseName": "Тяга штанги в наклоне", "weight": "60, 60, 65, 65", "approaches": 4, "dayRussian": "Среда" },
        { "id": "Wed_4", "exerciseName": "Тяга верхнего блока", "weight": "55, 55, 55", "approaches": 3, "dayRussian": "Среда" },
        { "id": "Wed_5", "exerciseName": "Тяга гантели к поясу", "weight": "28, 28, 28", "approaches": 3, "dayRussian": "Среда" },
        { "id": "Wed_6", "exerciseName": "Шраги с гантелями", "weight": "32, 32, 32, 32", "approaches": 4, "dayRussian": "Среда" },
        { "id": "Wed_7", "exerciseName": "ПШНБ (бицепс)", "weight": "35, 35, 35", "approaches": 3, "dayRussian": "Среда" },
        { "id": "Wed_8", "exerciseName": "Молотки", "weight": "16, 16, 16", "approaches": 3, "dayRussian": "Среда" },
        { "id": "Wed_9", "exerciseName": "Концентрированный подъем", "weight": "12, 12, 12", "approaches": 3, "dayRussian": "Среда" },
        { "id": "Wed_10", "exerciseName": "Гиперэкстензия", "weight": "15, 15, 15", "approaches": 3, "dayRussian": "Среда" },
        { "id": "Wed_11", "exerciseName": "Скручивания", "weight": "0, 0, 0, 0", "approaches": 4, "dayRussian": "Среда" }
    ],
    "Friday": [
        { "id": "Fri_1", "exerciseName": "Приседания со штангой", "weight": "80, 85, 90, 90", "approaches": 4, "dayRussian": "Пятница" },
        { "id": "Fri_2", "exerciseName": "Жим ногами", "weight": "140, 150, 160", "approaches": 3, "dayRussian": "Пятница" },
        { "id": "Fri_3", "exerciseName": "Выпады с гантелями", "weight": "18, 18, 18", "approaches": 3, "dayRussian": "Пятница" },
        { "id": "Fri_4", "exerciseName": "Разгибания ног", "weight": "40, 40, 45, 45", "approaches": 4, "dayRussian": "Пятница" },
        { "id": "Fri_5", "exerciseName": "Сгибания ног лежа", "weight": "30, 30, 35, 35", "approaches": 4, "dayRussian": "Пятница" },
        { "id": "Fri_6", "exerciseName": "Румынская тяга", "weight": "60, 65, 70", "approaches": 3, "dayRussian": "Пятница" },
        { "id": "Fri_7", "exerciseName": "Подъем на носки стоя", "weight": "50, 50, 50, 50", "approaches": 4, "dayRussian": "Пятница" },
        { "id": "Fri_8", "exerciseName": "Жим гантелей сидя", "weight": "20, 22, 22", "approaches": 3, "dayRussian": "Пятница" },
        { "id": "Fri_9", "exerciseName": "Обратные разведения", "weight": "8, 8, 8", "approaches": 3, "dayRussian": "Пятница" },
        { "id": "Fri_10", "exerciseName": "Подъем ног в висе", "weight": "0, 0, 0", "approaches": 3, "dayRussian": "Пятница" }
    ],
    "Tuesday": [], "Thursday": [], "Saturday": [], "Sunday": []
};

// 3. История упражнений (для графиков оставляем числа)
// 3. Расширенная история упражнений (рекорды/прогресс)
const exerciseHistory = [
    // --- ПОНЕДЕЛЬНИК ---
    // Жим штанги лежа
    { "id": 101, "exerciseName": "Жим штанги лежа", "weight": 60, "date": "2026-01-05", "timestamp": "2026-01-05T10:00:00Z" },
    { "id": 102, "exerciseName": "Жим штанги лежа", "weight": 62.5, "date": "2026-01-08", "timestamp": "2026-01-08T10:00:00Z" },
    { "id": 103, "exerciseName": "Жим штанги лежа", "weight": 65, "date": "2026-01-12", "timestamp": "2026-01-12T10:00:00Z" },
    { "id": 104, "exerciseName": "Жим штанги лежа", "weight": 67.5, "date": "2026-01-15", "timestamp": "2026-01-15T10:00:00Z" },
    { "id": 105, "exerciseName": "Жим штанги лежа", "weight": 70, "date": "2026-01-19", "timestamp": "2026-01-19T10:00:00Z" },
    { "id": 106, "exerciseName": "Жим штанги лежа", "weight": 72.5, "date": "2026-01-22", "timestamp": "2026-01-22T10:00:00Z" },
    { "id": 107, "exerciseName": "Жим штанги лежа", "weight": 75, "date": "2026-01-31", "timestamp": "2026-01-31T10:00:00Z" },

    // Армейский жим
    { "id": 110, "exerciseName": "Армейский жим", "weight": 30, "date": "2026-01-05", "timestamp": "2026-01-05T10:00:00Z" },
    { "id": 111, "exerciseName": "Армейский жим", "weight": 32.5, "date": "2026-01-12", "timestamp": "2026-01-12T10:00:00Z" },
    { "id": 112, "exerciseName": "Армейский жим", "weight": 35, "date": "2026-01-15", "timestamp": "2026-01-15T10:00:00Z" },
    { "id": 113, "exerciseName": "Армейский жим", "weight": 35, "date": "2026-01-19", "timestamp": "2026-01-19T10:00:00Z" },
    { "id": 114, "exerciseName": "Армейский жим", "weight": 37.5, "date": "2026-01-26", "timestamp": "2026-01-26T10:00:00Z" },
    { "id": 115, "exerciseName": "Армейский жим", "weight": 40, "date": "2026-01-31", "timestamp": "2026-01-31T10:00:00Z" },

    // --- СРЕДА ---
    // Становая тяга
    { "id": 201, "exerciseName": "Становая тяга", "weight": 90, "date": "2026-01-07", "timestamp": "2026-01-07T10:00:00Z" },
    { "id": 202, "exerciseName": "Становая тяга", "weight": 95, "date": "2026-01-10", "timestamp": "2026-01-10T10:00:00Z" },
    { "id": 203, "exerciseName": "Становая тяга", "weight": 100, "date": "2026-01-14", "timestamp": "2026-01-14T10:00:00Z" },
    { "id": 204, "exerciseName": "Становая тяга", "weight": 105, "date": "2026-01-17", "timestamp": "2026-01-17T10:00:00Z" },
    { "id": 205, "exerciseName": "Становая тяга", "weight": 110, "date": "2026-01-21", "timestamp": "2026-01-21T10:00:00Z" },
    { "id": 206, "exerciseName": "Становая тяга", "weight": 115, "date": "2026-01-24", "timestamp": "2026-01-24T10:00:00Z" },
    { "id": 207, "exerciseName": "Становая тяга", "weight": 120, "date": "2026-01-31", "timestamp": "2026-01-31T10:00:00Z" },

    // Тяга штанги в наклоне
    { "id": 210, "exerciseName": "Тяга штанги в наклоне", "weight": 50, "date": "2026-01-07", "timestamp": "2026-01-07T10:00:00Z" },
    { "id": 211, "exerciseName": "Тяга штанги в наклоне", "weight": 52.5, "date": "2026-01-14", "timestamp": "2026-01-14T10:00:00Z" },
    { "id": 212, "exerciseName": "Тяга штанги в наклоне", "weight": 55, "date": "2026-01-17", "timestamp": "2026-01-17T10:00:00Z" },
    { "id": 213, "exerciseName": "Тяга штанги в наклоне", "weight": 60, "date": "2026-01-21", "timestamp": "2026-01-21T10:00:00Z" },
    { "id": 214, "exerciseName": "Тяга штанги в наклоне", "weight": 60, "date": "2026-01-24", "timestamp": "2026-01-24T10:00:00Z" },
    { "id": 215, "exerciseName": "Тяга штанги в наклоне", "weight": 65, "date": "2026-01-31", "timestamp": "2026-01-31T10:00:00Z" },

    // --- ПЯТНИЦА ---
    // Приседания со штангой
    { "id": 301, "exerciseName": "Приседания со штангой", "weight": 70, "date": "2026-01-02", "timestamp": "2026-01-02T10:00:00Z" },
    { "id": 302, "exerciseName": "Приседания со штангой", "weight": 75, "date": "2026-01-09", "timestamp": "2026-01-09T10:00:00Z" },
    { "id": 303, "exerciseName": "Приседания со штангой", "weight": 80, "date": "2026-01-16", "timestamp": "2026-01-16T10:00:00Z" },
    { "id": 304, "exerciseName": "Приседания со штангой", "weight": 82.5, "date": "2026-01-19", "timestamp": "2026-01-19T10:00:00Z" },
    { "id": 305, "exerciseName": "Приседания со штангой", "weight": 85, "date": "2026-01-23", "timestamp": "2026-01-23T10:00:00Z" },
    { "id": 306, "exerciseName": "Приседания со штангой", "weight": 87.5, "date": "2026-01-26", "timestamp": "2026-01-26T10:00:00Z" },
    { "id": 307, "exerciseName": "Приседания со штангой", "weight": 90, "date": "2026-01-31", "timestamp": "2026-01-31T10:00:00Z" },

    // Жим ногами
    { "id": 310, "exerciseName": "Жим ногами", "weight": 100, "date": "2026-01-02", "timestamp": "2026-01-02T10:00:00Z" },
    { "id": 311, "exerciseName": "Жим ногами", "weight": 110, "date": "2026-01-09", "timestamp": "2026-01-09T10:00:00Z" },
    { "id": 312, "exerciseName": "Жим ногами", "weight": 125, "date": "2026-01-16", "timestamp": "2026-01-16T10:00:00Z" },
    { "id": 313, "exerciseName": "Жим ногами", "weight": 135, "date": "2026-01-19", "timestamp": "2026-01-19T10:00:00Z" },
    { "id": 314, "exerciseName": "Жим ногами", "weight": 145, "date": "2026-01-23", "timestamp": "2026-01-23T10:00:00Z" },
    { "id": 315, "exerciseName": "Жим ногами", "weight": 155, "date": "2026-01-26", "timestamp": "2026-01-26T10:00:00Z" },
    { "id": 316, "exerciseName": "Жим ногами", "weight": 160, "date": "2026-01-31", "timestamp": "2026-01-31T10:00:00Z" }
];

// 4. Профиль (оставляем без изменений)
const profileData = {
    "userName": "Heavy Lifter",
    "avatarUrl": "/img/default-avatar.png",
    "userWeight": 72.5,
    "userStartWeight": 65.0,
    "userGoalWeight": 80.0,
    "userWeightChange": 7.5,
    "userWeightToGoal": 7.5,
    "userTheme": "black",
    "totalWorkouts": 24,
    "totalHours": 36.0
};

const userId = 1;




db.serialize(() => {
    // 1. Сначала находим ID самого последнего созданного пользователя
    db.get("SELECT id FROM users ORDER BY id DESC LIMIT 1", [], (err, row) => {
        if (err) {
            console.error("Ошибка при поиске пользователя:", err.message);
            return;
        }

        if (!row) {
            console.log("❌ Пользователей в базе нет! Сначала зарегистрируйся.");
            process.exit();
            return;
        }

        const currentUserId = row.id;
        console.log(`Нашел пользователя с ID: ${currentUserId}. Загружаю данные...`);

        // 2. Используем полученный ID для обновления
        const sql = `UPDATE user_data SET weight_history = ?, train_data = ?, exercise_history = ?, profile_data = ? WHERE user_id = ?`;
        
        db.run(sql, [
            JSON.stringify(weightData), 
            JSON.stringify(trainData), 
            JSON.stringify(exerciseHistory), 
            JSON.stringify(profileData), 
            currentUserId
        ], function(err) {
            if (err) {
                console.error("Ошибка при обновлении:", err.message);
            } else if (this.changes === 0) {
                console.log("⚠️ Запись в user_data не найдена. Проверь, работает ли триггер при регистрации.");
            } else {
                console.log(`✅ База данных обновлена для пользователя ID: ${currentUserId}!`);
            }
            process.exit();
        });
    });
});