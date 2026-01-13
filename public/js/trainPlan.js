function resetUrl1() {
  document.location = "./trainMode";
}

document.addEventListener("DOMContentLoaded", function () {
  if (!window.auth.checkAuth()) return;
  window.auth.initTheme();
  
  const addBtn = document.querySelector(".add-btn");
  const modalOverlay = document.getElementById("modalOverlay");
  const closeModal = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelBtn");
  const saveBtn = document.getElementById("saveBtn");

  initializeWeekDays();

  if (addBtn) {
    addBtn.addEventListener("click", function () {
      modalOverlay.classList.add("active");
    });
  }

  function closeModalWindow() {
    modalOverlay.classList.remove("active");
    document.getElementById("exerciseName").value = "";
    document.getElementById("exerciseSets").value = "";
    document.getElementById("exerciseWeight").value = "";
  }

  if (closeModal) closeModal.addEventListener("click", closeModalWindow);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModalWindow);

  if (modalOverlay) {
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) {
        closeModalWindow();
      }
    });
  }

  if (document.querySelector(".exercises-scroll-container")) {
    new ExerciseLazyLoader();
  }
});

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ДНЯМИ НЕДЕЛИ ==========
async function initializeWeekDays() {
  const weekDays = document.querySelectorAll(".week-day");
  const weekLabel = document.querySelector(".week-label");
  
  const englishDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  
  const russianDays = [
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
    "Воскресенье",
  ];

  async function loadExercisesForDay(dayIndex) {
    const dayKey = englishDays[dayIndex];

    try {
      const response = await authFetch(`/trainingPlan/day/${dayKey}`);
      if (response.ok) {
        const dayData = await response.json();
        updateExercisesDisplay(dayData);
      } else {
        const allExercises = await getAllExercises();
        const dayExercises = allExercises.filter((ex) => ex.day === dayKey);
        updateExercisesDisplay({
          dayKey: dayKey,
          dayName: russianDays[dayIndex],
          exercises: dayExercises,
        });
      }
    } catch (error) {
      console.error("Ошибка загрузки упражнений:", error);
    }
  }

  weekDays.forEach((day, index) => {
    day.addEventListener("click", async function () {
      weekDays.forEach((d) => d.classList.remove("active"));
      this.classList.add("active");

      if (weekLabel) {
        weekLabel.textContent = russianDays[index];
      }

      await loadExercisesForDay(index);
    });
  });

  if (weekDays.length > 0) {
    await loadExercisesForDay(0);
  }
}

async function getAllExercises() {
  try {
    const response = await authFetch("/trainingPlan/all");
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error("Ошибка получения всех упражнений:", error);
  }
  return [];
}

function updateExercisesDisplay(dayData) {
  const exercisesContainer = document.getElementById("exercises-container");
  if (!exercisesContainer) return;

  exercisesContainer.innerHTML = "";

  const daySection = document.createElement("div");
  daySection.className = "day-section";

  const weekLabel = document.createElement("div");
  weekLabel.className = "week-label";
  weekLabel.textContent = dayData.dayName;
  daySection.appendChild(weekLabel);

  if (dayData.exercises && dayData.exercises.length > 0) {
    dayData.exercises.forEach((exercise) => {
      const exerciseElement = createExerciseElement(exercise);
      daySection.appendChild(exerciseElement);
    });
  } else {
    const noExercises = document.createElement("div");
    noExercises.className = "no-exercises";
    noExercises.textContent = "На этот день упражнения не запланированы";
    daySection.appendChild(noExercises);
  }

  exercisesContainer.appendChild(daySection);

  if (window.exerciseLazyLoader) {
    window.exerciseLazyLoader = new ExerciseLazyLoader();
  }
}

function createExerciseElement(exercise) {
  const exerciseDiv = document.createElement("div");
  exerciseDiv.className = "exercise-list";

  exerciseDiv.innerHTML = `
    <div class="exercise-card">
      <div class="exercise-info">
        <div class="exercise-name">${exercise.exerciseName || "Отдых.."}</div>
        <div class="exercise-details">
          <div class="exercise-weight">
            <span class="detail-label">Вес:</span>
            <span class="detail-value">
              ${exercise.weight ? exercise.weight + " кг" : "Свободный"}
            </span>
          </div>
          <div class="exercise-sets">
            <span class="detail-label">Подходы:</span>
            <span class="detail-value">
              ${exercise.approaches || "Свободное кол-во"}
            </span>
          </div>
        </div>
      </div>
      <div class="button_conteiner">
        <button class="btn-delete" onclick="openDeleteModal('${exercise.id}')">
          <div class="delete_btn-img"></div>
        </button>
        <button class="btn-edit" onclick="openEditModal('${exercise.id}', '${exercise.exerciseName}', '${exercise.weight}', '${exercise.approaches}')">
          <div class="edit_btn-img"></div>
        </button>
      </div>
    </div>
  `;

  return exerciseDiv;
}

function getActiveDayIndex() {
  const weekDays = document.querySelectorAll(".week-day");
  for (let i = 0; i < weekDays.length; i++) {
    if (weekDays[i].classList.contains("active")) {
      return i;
    }
  }
  return 0;
}

// ========== ФУНКЦИИ ДЛЯ УДАЛЕНИЯ УПРАЖНЕНИЙ ==========
let currentDeleteId = null;

async function deleteTaskById(id) {
  try {
    const response = await authFetch(`/trainingPlan/delete/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      window.location.reload();
    } else {
      const errorData = await response.json();
      console.log("Ошибка при удалении: " + errorData.error);
    }
  } catch (error) {
    console.error("Ошибка:", error);
  }
}

function openDeleteModal(id) {
  currentDeleteId = id;
  const modal = document.getElementById("deleteModal");
  modal.classList.add("active");
}

function closeDeleteModal() {
  const modal = document.getElementById("deleteModal");
  modal.classList.remove("active");
  currentDeleteId = null;
}

function confirmDelete() {
  if (currentDeleteId) {
    deleteTaskById(currentDeleteId);
    closeDeleteModal();
  }
}

// ========== ФУНКЦИИ ДЛЯ ДОБАВЛЕНИЯ УПРАЖНЕНИЙ ==========
async function addNewTask() {
  try {
    const exerciseDay = document.getElementById("exerciseDay").value;
    const exerciseName = document.getElementById("exerciseName").value;
    const weight = document.getElementById("exerciseWeight").value;
    const approaches = document.getElementById("exerciseSets").value;

    const taskData = {
      day: exerciseDay,
      exerciseName: exerciseName,
      weight: parseInt(weight),
      approaches: parseInt(approaches),
    };

    console.log("Отправка данных:", taskData);
    const response = await authFetch("/trainingPlan/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log("Упражнение добавлено:", responseData);
      document.getElementById("modalOverlay").classList.remove("active");

      document.getElementById("exerciseName").value = "";
      document.getElementById("exerciseSets").value = "";
      document.getElementById("exerciseWeight").value = "";
      window.location.reload();

      const activeDayIndex = getActiveDayIndex();
      await loadExercisesForDay(activeDayIndex);
    } else {
      const responseText = await response.text();
      console.error(`ERROR: ${responseText}`);
    }
  } catch (error) {}
}

// ========== ФУНКЦИИ ДЛЯ РЕДАКТИРОВАНИЯ УПРАЖНЕНИЙ ==========
let currentEditExerciseId = null;

function openEditModal(id, name, weight, approaches) {
  currentEditExerciseId = id;
  
  document.getElementById("edit-exercise-name").value = name || "";
  document.getElementById("edit-exercise-weight").value = weight || "";
  document.getElementById("edit-exercise-approaches").value = approaches || "";

  const modal = document.getElementById("editExerciseModal");
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeEditModal() {
  const modal = document.getElementById("editExerciseModal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
  }
  currentEditExerciseId = null;

  const form = document.getElementById("editExerciseForm");
  if (form) {
    form.reset();
  }
}

async function editTask() {
  try {
    if (!currentEditExerciseId) {
      console.error("Нет ID для редактирования");
      return;
    }
    const taskData = {
      exerciseName: document.getElementById("edit-exercise-name").value,
      weight: parseInt(document.getElementById("edit-exercise-weight").value),
      approaches: parseInt(document.getElementById("edit-exercise-approaches").value),
    };
    
    if (!taskData.exerciseName || isNaN(taskData.weight) || isNaN(taskData.approaches)) {
      alert("Пожалуйста, заполните все поля корректно");
      return;
    }

    console.log("Отправка данных на редактирование:", {
      id: currentEditExerciseId,
      data: taskData,
    });
    const response = await authFetch(`/trainingPlan/edit/${currentEditExerciseId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    });
    
    if (response.ok) {
      const responseData = await response.json();
      console.log("Задание обновлено:", responseData);
      closeEditModal();
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } else {
      const errorData = await response.json();
      console.error("Ошибка при обновлении:", errorData.error);
    }
  } catch (error) {
    console.error("Ошибка сети:", error);
    alert("Ошибка сети. Проверьте подключение к интернету");
  }
}

// ========== КЛАСС ДЛЯ LAZY LOADER ==========
class ExerciseLazyLoader {
  constructor() {
    this.scrollContainer = document.querySelector(".exercises-scroll-container");
    this.exercisesContainer = document.getElementById("exercises-container");

    if (!this.scrollContainer || !this.exercisesContainer) return;

    this.exercises = Array.from(this.exercisesContainer.querySelectorAll(".exercise-list"));
    this.initialCount = 5;
    this.loadCount = 2;
    this.currentIndex = 0;

    this.init();
  }

  init() {
    if (this.exercises.length <= this.initialCount) {
      this.exercises.forEach((exercise) => {
        exercise.classList.remove("hidden");
      });
      return;
    }

    this.exercises.forEach((exercise) => {
      exercise.classList.add("hidden");
    });

    this.showMoreExercises(this.initialCount);
    this.setupScrollListener();
  }

  showMoreExercises(count) {
    const endIndex = Math.min(this.currentIndex + count, this.exercises.length);

    for (let i = this.currentIndex; i < endIndex; i++) {
      const exercise = this.exercises[i];
      exercise.classList.remove("hidden");
      exercise.classList.add("fade-in");
    }

    this.currentIndex = endIndex;
  }

  setupScrollListener() {
    this.scrollContainer.addEventListener("scroll", () => {
      if (this.currentIndex >= this.exercises.length) return;

      const scrollPosition = this.scrollContainer.scrollTop + this.scrollContainer.clientHeight;
      const scrollHeight = this.scrollContainer.scrollHeight;
      const threshold = 50;

      if (scrollPosition >= scrollHeight - threshold) {
        this.showMoreExercises(this.loadCount);
      }
    });
  }

  addShowAllButton() {
    if (this.exercises.length > this.initialCount) {
      const showAllButton = document.createElement("button");
      showAllButton.textContent = "Показать все упражнения";
      showAllButton.className = "show-all-btn";

      showAllButton.addEventListener("click", () => {
        this.loadAllExercises();
        showAllButton.style.display = "none";
      });

      this.exercisesContainer.parentNode.insertBefore(showAllButton, this.exercisesContainer.nextSibling);
    }
  }

  loadAllExercises() {
    const remainingExercises = this.exercises.length - this.currentIndex;
    if (remainingExercises > 0) {
      this.showMoreExercises(remainingExercises);
    }
  }
}

// ========== ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ СОБЫТИЙ ==========
document.addEventListener("DOMContentLoaded", function () {
  const deleteModal = document.getElementById("deleteModal");
  if (deleteModal) {
    deleteModal.addEventListener("click", function (event) {
      if (event.target === this) {
        closeDeleteModal();
      }
    });
  }

  const editModal = document.getElementById("editExerciseModal");
  if (editModal) {
    editModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeEditModal();
      }
    });

    const cancelBtn = editModal.querySelector(".cancel-btn");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", closeEditModal);
    }
    const closeBtn = editModal.querySelector(".close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeEditModal);
    }
  }

  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async function (event) {
      event.preventDefault();
      const exerciseName = document.getElementById("exerciseName").value;
      const weight = document.getElementById("exerciseWeight").value;
      const approaches = document.getElementById("exerciseSets").value;
      const taskData = {
        exerciseName: exerciseName,
        weight: parseInt(weight),
        approaches: parseInt(approaches),
      };

      await addNewTask(taskData);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeDeleteModal();
      closeEditModal();
    }
  });
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