const db = require("./bin/db");
const { getRandomInt } = require("../utils/random");

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const russianDays = {
  Monday: "Понедельник",
  Tuesday: "Вторник",
  Wednesday: "Среда",
  Thursday: "Четверг",
  Friday: "Пятница",
  Saturday: "Суббота",
  Sunday: "Воскресенье",
};


// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ


function getUserDataDB(userId) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM user_data WHERE user_id = ?", [userId], (err, row) => {
      if (err) return reject(err);

      if (row) {
        try {
          resolve({
            trainData: JSON.parse(row.train_data),
            profileWeightList: JSON.parse(row.profile_data),
            weightHistory: JSON.parse(row.weight_history),
            exerciseHistory: JSON.parse(row.exercise_history)
          });
        } catch (parseError) {
          console.error("Ошибка парсинга JSON из БД:", parseError);
          reject(parseError);
        }
      } else {
        const defaultTrainData = {};
        daysOfWeek.forEach((day) => {
          defaultTrainData[day] = [];
        });

        const defaultProfile = {
          userName: "Пользователь",
          userWeight: 0,
          userStartWeight: 0,
          userGoalWeight: 0,
          userWeightChange: 0,
          userWeightToGoal: 0,
          userTheme: "black"
        };

        const defaultWeightHistory = [];
        const defaultExerciseHistory = [];

        db.run(
          `INSERT INTO user_data (user_id, train_data, profile_data, weight_history, exercise_history) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            JSON.stringify(defaultTrainData),
            JSON.stringify(defaultProfile),
            JSON.stringify(defaultWeightHistory),
            JSON.stringify(defaultExerciseHistory)
          ],
          (insertErr) => {
            if (insertErr) return reject(insertErr);
            resolve({
              trainData: defaultTrainData,
              profileWeightList: defaultProfile,
              weightHistory: defaultWeightHistory,
              exerciseHistory: defaultExerciseHistory
            });
          }
        );
      }
    });
  });
}

function saveUserDataDB(userId, columnName, data) {
  return new Promise((resolve, reject) => {
    const jsonStr = JSON.stringify(data);
    db.run(
      `UPDATE user_data SET ${columnName} = ? WHERE user_id = ?`,
      [jsonStr, userId],
      (err) => {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
}

function parseDateString(dateString) {
  if (!dateString) return new Date();
  const parts = dateString.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateString);
}

function updateCalculatedFields(profileWeightList) {
  profileWeightList.userWeightChange = profileWeightList.userWeight - profileWeightList.userStartWeight;
  profileWeightList.userWeightToGoal = profileWeightList.userGoalWeight - profileWeightList.userWeight;
}


// ФУНКЦИИ ТРЕНИРОВОЧНОГО ПЛАНА


async function getDaysForView(userId) {
  const { trainData } = await getUserDataDB(userId);
  const allDays = daysOfWeek.map(day => ({
    dayKey: day,
    dayName: russianDays[day],
    exercises: trainData[day] || []
  }));

  return {
    allDays: allDays,
    trainData: trainData,
    daysOfWeek,
    russianDays
  };
}

async function getDayData(userId, day) {
  const { trainData } = await getUserDataDB(userId);
  return {
    dayKey: day,
    dayName: russianDays[day],
    exercises: trainData[day] || [],
  };
}

async function addTask(userId, data) {
  const { day, exerciseName, weight, approaches } = data;

  if (!day || !daysOfWeek.includes(day)) return { error: "Invalid day" };
  if (!exerciseName || weight === undefined || approaches === undefined) return { error: "Invalid data" };

  const { trainData } = await getUserDataDB(userId);

  let maxId = 0;
  daysOfWeek.forEach((d) => {
    const tasks = trainData[d] || [];
    tasks.forEach((task) => {
      const idString = String(task.id);
      const match = idString.match(/\d+$/);
      if (match) {
        const idNum = parseInt(match[0], 10);
        if (idNum > maxId) maxId = idNum;
      }
    });
  });

  const newTask = {
    id: `${day}_${maxId + 1}`,
    exerciseName: exerciseName.trim(),
    weight: parseInt(weight),
    approaches: parseInt(approaches),
    day: day,
    dayRussian: russianDays[day],
  };

  if (!trainData[day]) trainData[day] = [];
  trainData[day].push(newTask);

  await saveUserDataDB(userId, "train_data", trainData);
  return newTask;
}


// ФУНКЦИИ РЕДАКТИРОВАНИЯ ДАННЫХ


async function editTask(userId, id, data) {
  const { exerciseName, weight, approaches } = data;
  const { trainData } = await getUserDataDB(userId);
  const searchId = String(id);

  let foundTask = null;
  let foundDay = null;

  for (const day of daysOfWeek) {
    const tasks = trainData[day] || [];
    const task = tasks.find((t) => String(t.id) === searchId);
    if (task) {
      foundTask = task;
      foundDay = day;
      break;
    }
  }

  if (!foundTask) return null;

  if (exerciseName !== undefined) foundTask.exerciseName = exerciseName.trim();
  if (weight !== undefined) foundTask.weight = parseInt(weight);
  if (approaches !== undefined) foundTask.approaches = parseInt(approaches);

  await saveUserDataDB(userId, "train_data", trainData);
  return { ...foundTask, day: foundDay };
}

async function editUserWeight(userId, data) {
  const { userWeight } = data;
  if (userWeight === undefined || isNaN(userWeight)) {
    return { error: "Неверное значение веса" };
  }

  const allData = await getUserDataDB(userId);
  const { profileWeightList, weightHistory } = allData;

  const newWeight = parseFloat(userWeight);
  const now = new Date();
  
  const weightEntry = {
    id: getRandomInt(1, 1000000000),
    weight: parseFloat(newWeight.toFixed(1)),
    date: now.toLocaleDateString('ru-RU'),
    timestamp: now.toISOString(),
  };

  weightHistory.push(weightEntry);
  weightHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  profileWeightList.userWeight = newWeight;
  updateCalculatedFields(profileWeightList);

  await saveUserDataDB(userId, "profile_data", profileWeightList);
  await saveUserDataDB(userId, "weight_history", weightHistory);

  return {
    success: true,
    profileWeightList,
    weightHistory: weightHistory.slice(0, 30)
  };
}

async function editGoalWeight(userId, data) {
  const { userGoalWeight } = data;
  if (userGoalWeight === undefined || isNaN(userGoalWeight)) {
    return { error: "Неверное значение" };
  }

  const { profileWeightList } = await getUserDataDB(userId);
  profileWeightList.userGoalWeight = parseFloat(userGoalWeight);
  updateCalculatedFields(profileWeightList);

  await saveUserDataDB(userId, "profile_data", profileWeightList);
  
  return { success: true, profileWeightList };
}
async function editStartWeight(userId, data) {
  const { userStartWeight } = data;
  if (userStartWeight === undefined || isNaN(userStartWeight)) {
    return { error: "Неверное значение" };
  }

  const { profileWeightList } = await getUserDataDB(userId);
  profileWeightList.userStartWeight = parseFloat(userStartWeight);
  updateCalculatedFields(profileWeightList);

  await saveUserDataDB(userId, "profile_data", profileWeightList);
  
  return { success: true, profileWeightList };
}



async function editUserName(userId, data) {
  const { userName } = data;
  const trimmedName = userName ? userName.trim() : "";
  
  if (trimmedName.length < 2) return { error: "Имя слишком короткое" };
  
  const { profileWeightList } = await getUserDataDB(userId);
  profileWeightList.userName = trimmedName;

  await saveUserDataDB(userId, "profile_data", profileWeightList);
  return { success: true, profileWeightList, message: "Имя обновлено" };
}

async function editUserTheme(userId, data) {
  const { userTheme } = data;
  const { profileWeightList } = await getUserDataDB(userId);
  
  profileWeightList.userTheme = userTheme.trim();
  
  await saveUserDataDB(userId, "profile_data", profileWeightList);
  return { success: true, profileWeightList };
}

// ФУНКЦИИ УДАЛЕНИЯ


async function deleteTaskById(userId, id) {
  const { trainData } = await getUserDataDB(userId);
  const searchId = String(id);
  let deletedTask = null;
  let dayOfTask = null;

  for (const day of daysOfWeek) {
    const tasks = trainData[day] || [];
    const index = tasks.findIndex((t) => String(t.id) === searchId);
    
    if (index !== -1) {
      deletedTask = tasks.splice(index, 1)[0];
      dayOfTask = day;
      break;
    }
  }

  if (deletedTask) {
    await saveUserDataDB(userId, "train_data", trainData);
    return { ...deletedTask, day: dayOfTask };
  }
  return null;
}


// ФУНКЦИИ ПРОФИЛЯ И ВЕСА


async function getProfileDataWithHistory(userId, period = '30days') {
  const { profileWeightList, weightHistory } = await getUserDataDB(userId);

  const now = new Date();
  let cutoffDate = new Date();

  switch (period) {
    case '30days': cutoffDate.setDate(now.getDate() - 30); break;
    case '3months': cutoffDate.setMonth(now.getMonth() - 3); break;
    case '6months': cutoffDate.setMonth(now.getMonth() - 6); break;
    case '1year': cutoffDate.setFullYear(now.getFullYear() - 1); break;
    case 'all': cutoffDate = new Date(0); break;
    default: cutoffDate.setDate(now.getDate() - 30);
  }
  cutoffDate.setHours(0, 0, 0, 0);

  const filteredHistory = weightHistory.filter(entry => {
    try {
      const entryDate = entry.timestamp ? new Date(entry.timestamp) : parseDateString(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate >= cutoffDate;
    } catch (error) {
      return false;
    }
  }).map(entry => ({
    ...entry,
    formattedDate: entry.date
  }));

  updateCalculatedFields(profileWeightList);

  return {
    ...profileWeightList,
    weightHistory: filteredHistory
  };
}


// ФУНКЦИИ ИСТОРИИ УПРАЖНЕНИЙ


async function addExerciseToHistory(userId, exerciseName, weight) {
  const { exerciseHistory } = await getUserDataDB(userId);
  const now = new Date();
  
  const entry = {
    id: getRandomInt(1, 1000000000),
    exerciseName: exerciseName,
    weight: parseFloat(weight),
    date: now.toLocaleDateString('ru-RU'),
    timestamp: now.toISOString(),
    dayOfWeek: daysOfWeek[now.getDay()] || 'Unknown'
  };

  exerciseHistory.push(entry);
  exerciseHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  await saveUserDataDB(userId, "exercise_history", exerciseHistory);
  return entry;
}

async function getExerciseHistoryByExerciseAndPeriod(userId, exerciseName, period = '3months') {
  const { exerciseHistory } = await getUserDataDB(userId);
  
  const now = new Date();
  let cutoffDate = new Date();

  if (period === 'all') {
    return exerciseHistory.filter(e => e.exerciseName === exerciseName);
  }

  switch(period) {
    case '3months': cutoffDate.setMonth(now.getMonth() - 3); break;
    case '6months': cutoffDate.setMonth(now.getMonth() - 6); break;
    case 'year': cutoffDate.setFullYear(now.getFullYear() - 1); break;
    default: cutoffDate.setMonth(now.getMonth() - 3);
  }

  return exerciseHistory.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    return entryDate >= cutoffDate && entry.exerciseName === exerciseName;
  });
}

async function getUniqueExerciseNames(userId) {
  const { exerciseHistory } = await getUserDataDB(userId);
  const names = new Set();
  exerciseHistory.forEach(entry => names.add(entry.exerciseName));
  return Array.from(names);
}


// ЭКСПОРТ


module.exports = {
  daysOfWeek,
  russianDays,
  
  getUserDataDB,
  
  getDaysForView,
  getDayData,
  addTask,
  editTask,
  deleteTaskById,
  
  getProfileDataWithHistory,
  editUserWeight,
  editGoalWeight,
  editStartWeight,
  editUserName,
  editUserTheme,
  
  addExerciseToHistory,
  getExerciseHistoryByExerciseAndPeriod,
  getUniqueExerciseNames
};