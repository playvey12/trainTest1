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
    avatarUrl: "/img/default-avatar.png",
    userWeight: 0,
    userStartWeight: 0,
    userGoalWeight: 0,
    userWeightChange: 0,
    userWeightToGoal: 0,
    userTheme: "black",
    totalWorkouts: 0, 
    totalHours: 0      
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
async function updateTrainingStats(userId, hoursToAdd) {
    const { profileWeightList } = await getUserDataDB(userId);
    profileWeightList.totalWorkouts = (profileWeightList.totalWorkouts || 0) + 1;
    profileWeightList.totalHours = (profileWeightList.totalHours || 0) + parseFloat(hoursToAdd);
    
    await saveUserDataDB(userId, "profile_data", profileWeightList);
    
    return {
        totalWorkouts: profileWeightList.totalWorkouts,
        totalHours: profileWeightList.totalHours
    };
}

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

  const dayKey = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase(); 

  const { trainData } = await getUserDataDB(userId);


  return {
    dayKey: day.toLowerCase(), 
    dayName: russianDays[day.toLowerCase()], 
    exercises: trainData[dayKey] || [], 
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
    weight: weight,
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
 if (weight !== undefined) foundTask.weight = weight;
  if (approaches !== undefined) foundTask.approaches = parseInt(approaches);

  await saveUserDataDB(userId, "train_data", trainData);
  return { ...foundTask, day: foundDay };
}


async function editTaskForTrainMode(userId, id, data) {
  const { exerciseName, weight } = data;
  const { trainData, exerciseHistory } = await getUserDataDB(userId);
  
  // 1. Просто ищем упражнение, чтобы убедиться, что оно существует
  const searchId = String(id);
  let foundInPlan = false;
  for (const day of daysOfWeek) {
    if ((trainData[day] || []).some(t => String(t.id) === searchId)) {
      foundInPlan = true;
      break;
    }
  }

  if (!foundInPlan) return null;

  // 2. Добавляем запись в историю для графика (НЕ ТРОГАЕМ trainData)
  if (weight !== undefined) {
    const now = new Date();
    const newHistoryEntry = {
      id: Math.floor(Math.random() * 1000000000),
      exerciseName: exerciseName,
      weight: parseFloat(weight),
      date: now.toISOString(),
      timestamp: now.toISOString()
    };
    
    exerciseHistory.push(newHistoryEntry);
    await saveUserDataDB(userId, "exercise_history", exerciseHistory);
  }

  // Мы НЕ вызываем saveUserDataDB для "train_data", 
  // поэтому старые веса (например, "300, 200, 200") останутся нетронутыми.
  
  return { success: true }; 
}

async function updateProfileStats(userId, data) {
  const { addWorkout, hoursToAdd } = data;
  
  // Получаем текущие данные из БД
  const allData = await getUserDataDB(userId);
  const profile = allData.profileWeightList;

  // 1. Обновляем часы (всегда прибавляем то, что натикало)
  // Используем parseFloat, чтобы избежать ошибок конкатенации строк
  const currentHours = parseFloat(profile.totalHours || 0);
  const newHours = currentHours + parseFloat(hoursToAdd);
  profile.totalHours = parseFloat(newHours.toFixed(2)); // Округляем до 2 знаков

  // 2. Обновляем счетчик тренировок (только если addWorkout === true)
  if (addWorkout) {
    const currentWorkouts = parseInt(profile.totalWorkouts || 0);
    profile.totalWorkouts = currentWorkouts + 1;
  }

  // Сохраняем обновленный объект profile_data обратно в БД
  await saveUserDataDB(userId, "profile_data", profile);

  return {
    totalWorkouts: profile.totalWorkouts,
    totalHours: profile.totalHours
  };
}
async function editUserWeight(userId, data) {
  const { userWeight } = data;
  if (userWeight === undefined || isNaN(userWeight)) {
    return { error: "Неверное значение веса" };
  }

  const allData = await getUserDataDB(userId);
  const { profileWeightList, weightHistory } = allData;

  const newWeight = parseFloat(parseFloat(userWeight).toFixed(1));
  const now = new Date();
  
  // Создаем ключ текущего дня в локальном формате, например "31.01.2026"
  const todayKey = now.toLocaleDateString('ru-RU');

  // Ищем индекс записи за сегодня
  const existingEntryIndex = weightHistory.findIndex(entry => {
    if (!entry.date) return false;
    // Сравниваем либо по ключу (если сохраняли так), либо через приведение к локальной дате
    const entryLocalDate = new Date(entry.date).toLocaleDateString('ru-RU');
    return entryLocalDate === todayKey;
  });

  if (existingEntryIndex !== -1) {
    // ОБНОВЛЯЕМ: заменяем вес в существующей колонке
    weightHistory[existingEntryIndex].weight = newWeight;
    weightHistory[existingEntryIndex].timestamp = now.toISOString(); // сохраняем точный момент обновления
    weightHistory[existingEntryIndex].date = now.toISOString();
  } else {
    // ДОБАВЛЯЕМ: новая колонка для нового дня
    const weightEntry = {
      id: getRandomInt(1, 1000000000),
      weight: newWeight,
      date: now.toISOString(),
      timestamp: now.toISOString()
    };
    weightHistory.push(weightEntry);
  }

  // Сортируем
  weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Ограничиваем историю
  const finalHistory = weightHistory.length > 60 ? weightHistory.slice(-60) : weightHistory;

  profileWeightList.userWeight = newWeight;
  updateCalculatedFields(profileWeightList);

  await saveUserDataDB(userId, "profile_data", profileWeightList);
  await saveUserDataDB(userId, "weight_history", finalHistory);

  return {
    success: true,
    profileWeightList,
    weightHistory: finalHistory // Возвращаем всю историю для корректного обновления
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


// В файле trainData.js
async function editUserName(userId, data) {
  const { userName } = data;
  const trimmedName = userName ? userName.trim() : "";
  
  if (trimmedName.length < 2) return { error: "Имя слишком короткое" };
  
  const allData = await getUserDataDB(userId);
  const profileWeightList = allData.profileWeightList; 

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
if (!profileWeightList.avatarUrl) {
    profileWeightList.avatarUrl = "/img/default-avatar.png";
  }
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

async function getExerciseHistoryByExerciseAndPeriod(userId, exerciseName, period) {
    const data = await getUserDataDB(userId);
    let history = data.exerciseHistory || [];

    // 1. Фильтруем по имени упражнения
    history = history.filter(item => item.exerciseName === exerciseName);

    // 2. Сортируем по дате (от старых к новым)
    history.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 3. Фильтруем по периоду (если нужно)
    const now = new Date();
    if (period === '30days') {
        const limitDate = new Date();
        limitDate.setDate(now.getDate() - 30);
        history = history.filter(item => new Date(item.date) >= limitDate);
    } else if (period === '3months') {
        const limitDate = new Date();
        limitDate.setMonth(now.getMonth() - 3);
        history = history.filter(item => new Date(item.date) >= limitDate);
    }

    return history;
}
async function getUniqueExerciseNames(userId) {
    const data = await getUserDataDB(userId);
    const history = data.exerciseHistory || [];
    
    // Собираем уникальные имена
    const uniqueNames = [...new Set(history.map(item => item.exerciseName))];
    return uniqueNames.sort(); // Сортируем по алфавиту
}


// ЭКСПОРТ


module.exports = {
  daysOfWeek,
  russianDays,
  saveUserDataDB,
  getUserDataDB,
  
  getDaysForView,
  getDayData,
  addTask,
  editTask,
  deleteTaskById,
  editTaskForTrainMode,

  getProfileDataWithHistory,
  editUserWeight,
  editGoalWeight,
  editStartWeight,
  editUserName,
  editUserTheme,
  
  addExerciseToHistory,
  getExerciseHistoryByExerciseAndPeriod,
  getUniqueExerciseNames,
  updateProfileStats
  
};