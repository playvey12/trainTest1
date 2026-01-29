document.addEventListener("DOMContentLoaded", function () {
  if (!window.auth.checkAuth()) return;
  window.auth.initTheme();
  
  const selectDayBtn = document.getElementById("select-day-btn");
  const startWorkoutBtn = document.getElementById("start-workout-btn");
  const finishWorkoutBtn = document.getElementById("finish-workout-btn");
  const dayModal = document.getElementById("day-modal");
  const resultsModal = document.getElementById("results-modal");
  const confirmModal = document.getElementById("confirm-modal");
  const editModal = document.getElementById("editExerciseModal");
  const closeDayModalBtn = document.querySelector(".modal-day-close-btn");
  const closeResultsBtn = document.querySelector(".modal-results-close-btn");
  const closeConfirmBtn = document.querySelector(".modal-confirm-close-btn");
  const confirmDayBtn = document.getElementById("confirm-day-btn");
  const closeResultsModalBtn = document.getElementById("close-results-btn");
  const cancelConfirmBtn = document.getElementById("cancel-confirm-btn");
  const confirmFinishBtn = document.getElementById("confirm-finish-btn");
  const dayCards = document.querySelectorAll(".day-card");
  const totalTimeElement = document.getElementById("total-time");
  const restTimeElement = document.getElementById("rest-time");
  const netTimeElement = document.getElementById("net-time");
  const workoutDurationElement = document.getElementById("workout-duration");

  let isWorkoutStarted = false;
  let selectedDay = null;
  let selectedCard = null;
  let workoutTimer = null;
  let workoutSeconds = 0;
  let isApproachActive = false;
  let activeExerciseId = null;
  let currentEditExerciseId = null;
  let activeRestTimers = new Map();
  let completedApproaches = new Map();
  let totalRestTime = 0;
  const restTime =5;

  // ========== ФУНКЦИИ ДЛЯ МОДАЛЬНЫХ ОКОН ==========
  if (selectDayBtn) {
    selectDayBtn.addEventListener("click", function () {
      dayModal.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  }

  if (closeDayModalBtn) {
    closeDayModalBtn.addEventListener("click", closeDayModal);
  }
  
  if (dayModal) {
    dayModal.addEventListener("click", function (e) {
      if (e.target === dayModal) {
        closeDayModal();
      }
    });
  }

  if (closeResultsBtn) {
    closeResultsBtn.addEventListener("click", closeResultsModal);
  }
  
  if (closeResultsModalBtn) {
    closeResultsModalBtn.addEventListener("click", closeResultsModal);
  }
  
  if (resultsModal) {
    resultsModal.addEventListener("click", function (e) {
      if (e.target === resultsModal) {
        closeResultsModal();
      }
    });
  }

  if (closeConfirmBtn) {
    closeConfirmBtn.addEventListener("click", closeConfirmModal);
  }
  
  if (cancelConfirmBtn) {
    cancelConfirmBtn.addEventListener("click", closeConfirmModal);
  }
  
  if (confirmModal) {
    confirmModal.addEventListener("click", function (e) {
      if (e.target === confirmModal) {
        closeConfirmModal();
      }
    });
  }

  if (confirmFinishBtn) {
    confirmFinishBtn.addEventListener("click", function () {
      closeConfirmModal();
      showWorkoutResults();
    });
  }

  dayCards.forEach((card) => {
    card.addEventListener("click", function () {
      dayCards.forEach((c) => c.classList.remove("selected"));
      this.classList.add("selected");
      selectedCard = this;
      if (confirmDayBtn) {
        confirmDayBtn.disabled = false;
      }
    });
  });

  if (confirmDayBtn) {
    confirmDayBtn.addEventListener("click", function () {
      if (selectedCard) {
        const dayEnglish = selectedCard.getAttribute("data-day");
        setSelectedDay(dayEnglish);
        closeDayModal();
      }
    });
  }

  function closeDayModal() {
    if (dayModal) {
      dayModal.classList.remove("active");
    }
    document.body.style.overflow = "auto";
    dayCards.forEach((card) => card.classList.remove("selected"));
    if (confirmDayBtn) {
      confirmDayBtn.disabled = true;
    }
    selectedCard = null;
  }

  function closeResultsModal() {
    if (resultsModal) {
      resultsModal.classList.remove("active");
    }
    document.body.style.overflow = "auto";
    resetWorkoutData();
  }

  function openConfirmModal() {
  if (workoutDurationElement) {
    workoutDurationElement.textContent = `Текущее время: ${formatTime(workoutSeconds)}`;
  }
  
 
  const activeRestSeconds = Array.from(activeRestTimers.keys()).length * restTime;
  
  stopTimer();
  
  if (confirmModal) {
    confirmModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

  function openResultsModal(totalTime, restTime, netTime) {
    if (totalTimeElement) totalTimeElement.textContent = formatTime(totalTime);
    if (restTimeElement) restTimeElement.textContent = formatTime(restTime);
    if (netTimeElement) netTimeElement.textContent = formatTime(netTime);

    if (resultsModal) {
      resultsModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  function closeConfirmModal() {
  if (confirmModal) {
    confirmModal.classList.remove("active");
  }
  document.body.style.overflow = "auto";
  
  if (isWorkoutStarted) {
    startTimer();

    if (isApproachActive && activeExerciseId) {
      const activeBtn = document.querySelector(`[data-train*='"id":"${activeExerciseId}"']`);
      if (activeBtn) {
        const timer = activeRestTimers.get(activeExerciseId);
        if (timer) {
          activeBtn.disabled = true;
          activeBtn.style.opacity = "0.7";
          activeBtn.style.cursor = "not-allowed";
        } else {
          activeBtn.disabled = false;
          activeBtn.style.opacity = "1";
          activeBtn.style.cursor = "pointer";
          activeBtn.textContent = "Подтвердить подход";
        }
      }
      resetAllBlockedButtons();
    }
  }
}
  // ========== ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ ТРЕНИРОВКОЙ ==========
  window.setSelectedDay = function (day) {
    selectedDay = day;
    const russianDay = getRussianDayName(day);
    if (selectDayBtn) {
      selectDayBtn.textContent = `Сменить день (${russianDay})`;
    }

    if (window.trainingLazyLoader) {
      window.trainingLazyLoader.showExercisesForDay(day);
    }
    setTimeout(() => {
      updateCompleteButtonsState();
    }, 500);
  };

  if (startWorkoutBtn) {
    startWorkoutBtn.addEventListener("click", function () {
      if (!selectedDay) {
        alert("Сначала выберите день тренировки!");
        return;
      }

      if (!isWorkoutStarted) {
        isWorkoutStarted = true;
        startWorkoutBtn.disabled = true;
        startWorkoutBtn.textContent = "Тренировка идет...";
        startWorkoutBtn.style.opacity = "0.7";

        if (finishWorkoutBtn) {
          finishWorkoutBtn.disabled = false;
          finishWorkoutBtn.style.opacity = "1";
        }

        updateCompleteButtonsState();
        initApproachesMap();
        startTimer();

        
      }
    });
  }

  if (finishWorkoutBtn) {
    finishWorkoutBtn.addEventListener("click", function () {
      if (isWorkoutStarted) {
        openConfirmModal();
      }
    });
  }

 function showWorkoutResults() {
  stopTimer();
  isWorkoutStarted = false;
  activeRestTimers.forEach((timer, exerciseId) => {
    if (timer) clearInterval(timer);
  });
  activeRestTimers.clear();
  
  resetAllBlockedButtons();
  isApproachActive = false;
  activeExerciseId = null;
  
  const totalTime = workoutSeconds;
  const restTime = totalRestTime;
  const netTime = Math.max(0, totalTime - restTime);
  
  openResultsModal(totalTime, restTime, netTime);
  resetWorkoutButtons();
  updateCompleteButtonsState();
  

}

  function resetWorkoutButtons() {
    if (startWorkoutBtn) {
      startWorkoutBtn.disabled = false;
      startWorkoutBtn.textContent = "Начать тренировку";
      startWorkoutBtn.style.opacity = "1";
    }

    if (finishWorkoutBtn) {
      finishWorkoutBtn.disabled = true;
      finishWorkoutBtn.style.opacity = "0.7";
    }
  }

  function resetWorkoutData() {
    completedApproaches.clear();
    totalRestTime = 0;
    workoutSeconds = 0;
    activeRestTimers.clear();
    resetAllBlockedButtons();
    isApproachActive = false;
    activeExerciseId = null;
  }

  function getRussianDayName(englishDay) {
    const days = {
      Monday: "Пн",
      Tuesday: "Вт",
      Wednesday: "Ср",
      Thursday: "Чт",
      Friday: "Пт",
      Saturday: "Сб",
      Sunday: "Вс",
    };
    return days[englishDay] || englishDay;
  }

  // ========== ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ КНОПКАМИ ==========
  function blockCompleteButtons(blocked) {
    const completeButtons = document.querySelectorAll(".complete-btn");
   
    completeButtons.forEach((button) => {
      if (button.classList.contains("other-blocked")) {
        return;
      }
      
      if (blocked) {
        button.disabled = true;
        button.style.opacity = "0.5";
        button.style.cursor = "not-allowed";
      } else {
        button.disabled = false;
        button.style.opacity = "1";
        button.style.cursor = "pointer";
      }
    });
  }

  function initApproachesMap() {
    const completeButtons = document.querySelectorAll(".complete-btn");
    completeButtons.forEach((button) => {
      const trainDataString = button.getAttribute("data-train");
      if (trainDataString) {
        try {
          const trainData = JSON.parse(trainDataString);
          const exerciseId = trainData.id;
          const currentApproaches = parseInt(trainData.approaches) || 0;

          button.setAttribute("data-initial-approaches", currentApproaches);

          if (!completedApproaches.has(exerciseId)) {
            completedApproaches.set(exerciseId, 0);
          }
        } catch (error) {
          console.error("Ошибка парсинга data-train при инициализации:", error);
        }
      }
    });
  }

  function initConfirmApproaches() {


    const exercisesContainer = document.getElementById("exercises-container");
    if (exercisesContainer) {
      exercisesContainer.addEventListener("click", handleCompleteClick);
     
    } else {
      console.error("Контейнер упражнений не найден");
    }
  }

  function blockAllOtherCompleteButtons(activeId, block) {
    const completeButtons = document.querySelectorAll(".complete-btn");
    completeButtons.forEach((button) => {
      const trainDataString = button.getAttribute("data-train");
      if (trainDataString) {
        try {
          const trainData = JSON.parse(trainDataString);
          const exerciseId = trainData.id;
          
          if (exerciseId !== activeId) {
            button.disabled = block;
            button.style.opacity = block ? "0.5" : "1";
            button.style.cursor = block ? "not-allowed" : "pointer";
            
            if (block) {
              button.classList.add("other-blocked");
            } else {
              button.classList.remove("other-blocked");
            }
          }
        } catch (error) {
          console.error("Ошибка при блокировке кнопок:", error);
        }
      }
    });
  }

  function initCompleteButtons() {
    const completeButtons = document.querySelectorAll('.complete-btn');
    completeButtons.forEach(button => {
      button.removeEventListener('click', handleCompleteClick);
      button.addEventListener('click', handleCompleteClick);
    });
    
    
  }

  async function logExerciseProgress(exerciseName, weight) {
    try {
      const response = await authFetch('/profileMain/log-exercise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseName: exerciseName,
          weight: weight
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сервера');
      }
    } catch (error) {
      throw error;
    }
  }

  async function handleCompleteClick(event) {
    const completeBtn = event.target.closest(".complete-btn");

    if (completeBtn && !completeBtn.disabled && isWorkoutStarted) {
      if (isApproachActive) {
        showNotification("Завершите текущий подход перед началом следующего!", "info");
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const trainDataString = completeBtn.getAttribute("data-train");

      if (trainDataString) {
        try {
          const trainData = JSON.parse(trainDataString);
          const currentApproaches = parseInt(trainData.approaches) || 0;
          const exerciseId = trainData.id;
          const exerciseName = trainData.exerciseName || "Упражнение";
          const weight = parseInt(trainData.weight) || 0;

          isApproachActive = true;
          activeExerciseId = exerciseId;

          let remainingApproaches = currentApproaches - 1;
          if (remainingApproaches < 0) {
            remainingApproaches = 0;
          }

          trainData.approaches = remainingApproaches.toString();

          if (weight > 0) {
            try {
              await logExerciseProgress(exerciseName, weight);
        
            } catch (error) {
              console.error("Ошибка при сохранении прогресса упражнения:", error);
            }
          }

          completeBtn.setAttribute("data-train", JSON.stringify(trainData));
          updateApproachesDisplay(completeBtn, remainingApproaches);
          blockAllOtherCompleteButtons(exerciseId, true);
          startRestTimer(completeBtn, exerciseId);

          const completedCount = completedApproaches.get(exerciseId) || 0;
          completedApproaches.set(exerciseId, completedCount + 1);
          totalRestTime += restTime;
        } catch (error) {
        
          showNotification("Ошибка обработки данных", "error");
          isApproachActive = false;
          activeExerciseId = null;
        }
      }
    }
  }

  function updateApproachesDisplay(button, remainingApproaches) {
    const exerciseCard = button.closest(".exercise-card");
    if (exerciseCard) {
      const approachesElement = exerciseCard.querySelector(".approaches-value");
      if (approachesElement) {
        if (remainingApproaches > 0) {
          approachesElement.textContent = remainingApproaches;
        } else {
          approachesElement.textContent = "Выполнено";
          approachesElement.style.color = "#4CAF50";
          approachesElement.style.fontWeight = "bold";

          setTimeout(() => {
            fadeOutAndRemoveExercise(exerciseCard);
          }, 1000);
        }
      }
    }
  }

  function fadeOutAndRemoveExercise(exerciseCard) {
    exerciseCard.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    exerciseCard.style.opacity = "0";
    exerciseCard.style.transform = "translateY(-20px)";

    setTimeout(() => {
      if (exerciseCard.parentNode) {
        exerciseCard.parentNode.removeChild(exerciseCard);
        showNextExerciseIfAvailable();
      }
    }, 500);
  }

  function showNextExerciseIfAvailable() {
    const exercisesContainer = document.getElementById("exercises-container");
    if (!exercisesContainer) return;

    const hiddenExercises = exercisesContainer.querySelectorAll(".exercise-list.hidden");

    if (hiddenExercises.length > 0) {
      const nextExercise = hiddenExercises[0];
      setTimeout(() => {
        nextExercise.style.display = "flex";
        nextExercise.classList.remove("hidden");
        nextExercise.classList.add("fade-in");
        nextExercise.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 300);
    }
  }

 function startRestTimer(button, exerciseId) {
  let timeLeft = restTime;
  
  button.disabled = true;
  button.style.opacity = "0.7";
  button.style.cursor = "not-allowed";
  updateButtonTimerText(button, timeLeft);
  

  const startTime = Date.now();
  
  const timerId = setInterval(() => {
    timeLeft--;
    
    if (timeLeft <= 0) {
      clearInterval(timerId);
      activeRestTimers.delete(exerciseId);
      

      const actualRestTime = Math.floor((Date.now() - startTime) / 1000);
      totalRestTime += Math.min(actualRestTime, restTime);
      
      isApproachActive = false;
      activeExerciseId = null;
      blockAllOtherCompleteButtons(exerciseId, false);
      
      button.disabled = false;
      button.style.opacity = "1";
      button.style.cursor = "pointer";
      button.textContent = "Подтвердить подход";
      
      showNotification("Отдых завершен! Можно выполнять следующий подход", "success");
    } else {
      updateButtonTimerText(button, timeLeft);
    }
  }, 1000);
  
  activeRestTimers.set(exerciseId, timerId);
}

  function resetAllBlockedButtons() {
    isApproachActive = false;
    activeExerciseId = null;
    
    const completeButtons = document.querySelectorAll(".complete-btn");
    completeButtons.forEach((button) => {
      button.classList.remove("other-blocked");
      button.disabled = false;
      button.style.opacity = "1";
      button.style.cursor = "pointer";
    });
  }

  function updateButtonTimerText(button, secondsLeft) {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    button.textContent = `Отдых: ${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  // ========== ФУНКЦИИ ДЛЯ УВЕДОМЛЕНИЙ ==========
  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === "success" ? "#4CAF50" : "#f44336"};
      color: white;
      border-radius: 5px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // ========== ФУНКЦИИ ДЛЯ ТАЙМЕРА ==========
  function startTimer() {
    const timerElement = document.getElementById("timer");
    
    if (workoutTimer) {
      clearInterval(workoutTimer);
    }
    
    workoutTimer = setInterval(() => {
      workoutSeconds++;
      updateTimerDisplay(timerElement);
    }, 1000);
  }

  function stopTimer() {
    if (workoutTimer) {
      clearInterval(workoutTimer);
      workoutTimer = null;
    }
  }

  function resetTimer() {
    stopTimer();
    workoutSeconds = 0;
    updateTimerDisplay(document.getElementById("timer"));
  }

  function updateTimerDisplay(timerElement) {
    if (timerElement) {
      timerElement.textContent = formatTime(workoutSeconds);
    }
  }

  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return (
      `${hours.toString().padStart(2, "0")}:` +
      `${minutes.toString().padStart(2, "0")}:` +
      `${secs.toString().padStart(2, "0")}`
    );
  }

  // ========== ФУНКЦИИ ДЛЯ РЕДАКТИРОВАНИЯ УПРАЖНЕНИЙ ==========
  window.openEditModal = function(id, weight) {
    currentEditExerciseId = id;
    document.getElementById("edit-exercise-weight").value = weight || "";
  
    if (editModal) {
      editModal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  };

  function closeEditModal() {
    if (editModal) {
      editModal.classList.remove("active");
    }
    document.body.style.overflow = "auto";
    currentEditExerciseId = null;
    const form = document.getElementById("editExerciseForm");
    if (form) {
      form.reset();
    }
  }

  if (editModal) {
    editModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeEditModal();
      }
    });

    const cancelBtn = editModal.querySelector(".modal-edit-cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", closeEditModal);
    }

    const closeBtn = editModal.querySelector(".modal-edit-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeEditModal);
    }
    
    const editForm = document.getElementById("editExerciseForm");
    if (editForm) {
      editForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        await editTask();
      });
    }
  }

  window.editTask = async function() {
  try {
    if (!currentEditExerciseId) {
      console.error("Нет ID для редактирования");
      return;
    }

    const weight = document.getElementById("edit-exercise-weight").value;


    const taskData = {
      weight: weight ? parseInt(weight) : 0,
     
    };

    const response = await authFetch(`/trainMode/edit/${currentEditExerciseId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    });

    if (response.ok) {
      const responseData = await response.json();
   
      
      updateExerciseOnPage(currentEditExerciseId, taskData.weight);
      
      showNotification("Упражнение успешно обновлено", "success");
      closeEditModal();
    } else {
      const errorData = await response.json();
   
      showNotification("Ошибка при обновлении упражнения", "error");
    }
  } catch (error) {
  
    showNotification("Ошибка сети. Проверьте подключение к интернету", "error");
  }
};
  function updateExerciseOnPage(exerciseId, weight) { 
  const exerciseCard = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
  
  if (exerciseCard) {
    const weightElement = exerciseCard.querySelector(".weight-value");
    if (weightElement) {
      if (weight > 0) {
        weightElement.textContent = `${weight} кг`;
      } else {
        weightElement.textContent = "Свободный";
      }
    }
    
    

    const completeBtn = exerciseCard.querySelector(".complete-btn");
    if (completeBtn) {
      const trainDataString = completeBtn.getAttribute("data-train");
      if (trainDataString) {
        try {
          const trainData = JSON.parse(trainDataString);
          trainData.weight = weight.toString();
          
          
          completeBtn.setAttribute("data-train", JSON.stringify(trainData));
      
        } catch (error) {
          console.error("Ошибка обновления data-train:", error);
        }
      }
    }
  }
}
  // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
  function reinitializeCompleteButtons() {

    
    const exercisesContainer = document.getElementById("exercises-container");
    if (exercisesContainer) {
      exercisesContainer.removeEventListener("click", handleCompleteClick);
      exercisesContainer.addEventListener("click", handleCompleteClick);
      console.log("Обработчик событий обновлен");
    }
    
    updateCompleteButtonsState();
  }

  function updateCompleteButtonsState() {
    const completeButtons = document.querySelectorAll(".complete-btn");

    
    if (completeButtons.length > 0) {
      if (isWorkoutStarted && !isApproachActive) {
     
        blockCompleteButtons(false);
      } else {
  
        blockCompleteButtons(true);
      }
    } else {
      console.log("Кнопки не найдены, возможно упражнения еще не загружены");
    }
  }

  if (finishWorkoutBtn) {
    finishWorkoutBtn.disabled = true;
    finishWorkoutBtn.style.opacity = "0.7";
  }

  initConfirmApproaches();
  updateCompleteButtonsState();

  // ========== ЗАКРЫТИЕ ПО ESC ==========
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeEditModal();
      closeDayModal();
      closeResultsModal();
      closeConfirmModal();
    }
  });

  // ========== ДОБАВЛЕНИЕ CSS АНИМАЦИЙ ==========
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .complete-btn:disabled {
      pointer-events: none;
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .complete-btn.other-blocked {
      background-color: #f0f0f0;
      border-color: #ccc;
      color: #999;
    }
    
    .exercise-card {
      position: relative;
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    .exercise-card.fade-out {
      opacity: 0;
      transform: translateY(-20px);
    }
    
    .exercise-list.fade-in {
      animation: fadeIn 0.5s ease forwards;
    }
    
    .exercise-list.hidden {
      display: none;
      opacity: 0;
    }
    
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    }
    
    .notification.success {
      background: #4CAF50;
      color: white;
    }
    
    .notification.error {
      background: #f44336;
      color: white;
    }
    
    .notification.info {
      background: #2196F3;
      color: white;
    }
  `;
  document.head.appendChild(style);


});

// ========== КЛАСС ДЛЯ LAZY LOADER ==========
class TrainingLazyLoader {
  constructor() {
    this.scrollContainer = document.querySelector(".exercises-scroll-container");
    this.exercisesContainer = document.getElementById("exercises-container");
    this.exercises = Array.from(this.exercisesContainer.querySelectorAll(".exercise-list"));
    this.daySections = Array.from(this.exercisesContainer.querySelectorAll(".day-section"));
    this.initialCount = 5;
    this.loadCount = 4;
    this.currentIndex = 0;
    this.isFilteredMode = false;

    this.dayTranslations = {
      Monday: "Понедельник",
      Tuesday: "Вторник",
      Wednesday: "Среда",
      Thursday: "Четверг",
      Friday: "Пятница",
      Saturday: "Суббота",
      Sunday: "Воскресенье",
    };

    this.hideAllExercises();
    this.showSelectDayMessage();
    this.translateDayLabels();
  }

  hideAllExercises() {
    this.exercises.forEach((exercise) => {
      exercise.style.display = "none";
      exercise.classList.add("hidden");
    });

    this.daySections.forEach((section) => {
      section.style.display = "none";
    });
  }

  showSelectDayMessage() {
    if (document.getElementById("select-day-message")) {
      return;
    }

    const messageDiv = document.createElement("div");
    messageDiv.id = "select-day-message";
    messageDiv.className = "select-day-message";
    messageDiv.innerHTML = `
      <div class="message-icon">📅</div>
      <div class="message-title">Выберите день тренировки</div>
      <div class="message-text">Нажмите кнопку "Выбрать день" для выбора дня</div>
    `;

    this.exercisesContainer.parentNode.insertBefore(messageDiv, this.exercisesContainer);
    this.addMessageStyles();
  }

  addMessageStyles() {
    if (document.getElementById("message-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "message-styles";
    style.textContent = `
      .select-day-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 400px;
        text-align: center;
        padding: 40px 20px;
        background: var(--card-bg);
        border-radius: var(--border-radius);
        margin-bottom: 20px;
        box-shadow: var(--shadow);
        opacity: 0;
        animation: fadeIn 0.5s ease forwards;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .message-icon {
        font-size: 64px;
        margin-bottom: 20px;
        opacity: 0.7;
      }
      
      .message-title {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 10px;
        color: var(--text-color);
      }
      
      .message-text {
        font-size: 16px;
        color: var(--text-muted);
        max-width: 300px;
        line-height: 1.5;
      }
      
      .exercises-wrapper.with-message {
        display: flex;
        flex-direction: column;
      }
    `;

    document.head.appendChild(style);
    this.exercisesContainer.parentNode.classList.add("with-message");
  }

  removeSelectDayMessage() {
    const message = document.getElementById("select-day-message");
    if (message) {
      message.style.opacity = "0";
      message.style.transform = "translateY(-20px)";

      setTimeout(() => {
        message.remove();
        this.exercisesContainer.parentNode.classList.remove("with-message");
      }, 300);
    }
  }

  translateDayLabels() {
    this.daySections.forEach((section) => {
      const weekLabel = section.querySelector(".week-label");
      if (weekLabel) {
        const englishDay = section.getAttribute("data-day");
        if (englishDay && this.dayTranslations[englishDay]) {
          weekLabel.textContent = this.dayTranslations[englishDay];
        }
      }
    });
  }

  showExercisesForDay(dayEnglish) {
    this.removeSelectDayMessage();
    this.isFilteredMode = true;

    if (this.scrollHandler) {
      this.scrollContainer.removeEventListener("scroll", this.scrollHandler);
    }

    let targetSection = null;
    this.daySections.forEach((section) => {
      const sectionDay = section.getAttribute("data-day");
      if (sectionDay === dayEnglish) {
        targetSection = section;
      }
    });

    if (targetSection) {
      this.daySections.forEach((section) => {
        section.style.display = "none";
      });

      targetSection.style.display = "block";
      const exercisesInSection = Array.from(targetSection.querySelectorAll(".exercise-list"));

      exercisesInSection.forEach((exercise) => {
        exercise.style.display = "none";
        exercise.classList.add("hidden");
      });

      this.exercises = exercisesInSection;
      this.currentIndex = 0;

      this.showMoreExercises(Math.min(this.initialCount, exercisesInSection.length));
      this.setupScrollListener();
      this.scrollContainer.scrollTop = 0;

   
      
      setTimeout(() => {
        if (typeof initCompleteButtons === 'function') {
          initCompleteButtons();
        }
        if (typeof updateCompleteButtonsState === 'function') {
          updateCompleteButtonsState();
        }
      }, 300);
    }
  }

  showMoreExercises(count) {
    if (this.exercises.length === 0) return;

    const endIndex = Math.min(this.currentIndex + count, this.exercises.length);
    const exercisesToShow = this.exercises.slice(this.currentIndex, endIndex);

    exercisesToShow.forEach((exercise, index) => {
      setTimeout(() => {
        exercise.style.display = "flex";
        exercise.classList.remove("hidden");
        exercise.classList.add("fade-in");
      }, index * 80);
    });

    this.currentIndex = endIndex;
  }

  setupScrollListener() {
    if (this.scrollHandler) {
      this.scrollContainer.removeEventListener("scroll", this.scrollHandler);
    }

    this.scrollHandler = () => {
      if (this.currentIndex >= this.exercises.length) return;

      const scrollPosition = this.scrollContainer.scrollTop + this.scrollContainer.clientHeight;
      const scrollHeight = this.scrollContainer.scrollHeight;
      const threshold = 30;

      if (scrollPosition >= scrollHeight - threshold) {
        this.showMoreExercises(this.loadCount);
      }
    };

    this.scrollContainer.addEventListener("scroll", this.scrollHandler);
  }

  resetToInitialState() {
    if (this.scrollHandler) {
      this.scrollContainer.removeEventListener("scroll", this.scrollHandler);
    }

    this.exercises.forEach((exercise) => {
      exercise.style.display = "none";
      exercise.classList.add("hidden");
    });

    this.daySections.forEach((section) => {
      section.style.display = "none";
    });

    this.exercises = Array.from(this.exercisesContainer.querySelectorAll(".exercise-list"));
    this.showSelectDayMessage();
    this.currentIndex = 0;
    this.isFilteredMode = false;
  }
}

// ========== ИНИЦИАЛИЗАЦИЯ LAZY LOADER ==========
document.addEventListener("DOMContentLoaded", () => {
  const lazyLoader = new TrainingLazyLoader();
  window.trainingLazyLoader = lazyLoader;
});

// ========== ФУНКЦИИ ДЛЯ СМЕНЫ ТЕМЫ ==========
const bodyProf = document.querySelector('body');
let savedTheme = localStorage.getItem('themeMode')
if (savedTheme){
    bodyProf.classList.remove('pink-theme', 'black-theme');
    bodyProf.classList.add(savedTheme + '-theme');
} else {
    const defaultTheme = 'black';
    body.classList.add(defaultTheme + '-theme');
    localStorage.setItem('themeMode', defaultTheme);
}