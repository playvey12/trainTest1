// ========== ГЛОБАЛЬНОЕ СОСТОЯНИЕ ==========
let currentDeleteId = null;
let currentEditExerciseId = null;

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener("DOMContentLoaded", function () {
    // Проверка авторизации и темы
    if (window.auth) {
        if (!window.auth.checkAuth()) return;
        window.auth.initTheme();
    }

    initializeWeekDays();
    setupModalListeners();

    // Загрузка данных для активного дня при старте
    const activeDayCard = document.querySelector(".day-card.active") || document.querySelector(".day-card");
    if (activeDayCard) {
        activeDayCard.classList.add("active");
        loadExercisesForDay(activeDayCard.getAttribute("data-day"));
    }
});

// ========== КАЛЕНДАРЬ ==========
function initializeWeekDays() {
    const dayCards = document.querySelectorAll(".day-card");
    
    dayCards.forEach((card) => {
        card.addEventListener("click", async function () {
            if (this.classList.contains("active")) return;

            dayCards.forEach((c) => c.classList.remove("active"));
            this.classList.add("active");

            const dayKey = this.getAttribute("data-day");
            await loadExercisesForDay(dayKey);
        });
    });
}

async function loadExercisesForDay(dayKey) {
    const container = document.querySelector(".exercise-list");
    if (!container) return;

    container.innerHTML = '<div class="loader">Загрузка...</div>';
    
    try {
        const response = await authFetch(`/trainingPlan/day/${dayKey}`);
        if (response.ok) {
            const data = await response.json();
            renderExercises(data.exercises); 
        }
    } catch (error) {
        console.error("Ошибка при загрузке дня:", error);
        container.innerHTML = `<p class="error-msg">Ошибка загрузки данных</p>`;
    }
}

// ========== РЕНДЕРИНГ ==========
function renderExercises(exercises) {
    const container = document.querySelector(".exercise-list");
    if (!container) return;

    container.innerHTML = "";

    if (!exercises || exercises.length === 0) {
        container.innerHTML = `<p class="empty-msg">На этот день упражнения не запланированы</p>`;
        return;
    }

    exercises.forEach(ex => {
        const card = document.createElement("div");
        card.className = "exercise-card fade-in";
        card.setAttribute("data-id", ex.id);

        // Используем структуру из твоего HBS
        card.innerHTML = `
            <div class="exercise-icon-wrapper">
                <div class="exercise-icon"><i class="fas fa-dumbbell"></i></div>
            </div>
            <div class="exercise-info">
                <h3>${ex.exerciseName}</h3>
                <p>
                    <i class="fas fa-redo"></i> ${ex.approaches} подх.
                    <i class="fas fa-weight-hanging"></i> ${ex.weight} кг
                </p>
            </div>
            <div class="exercise-actions">
                <button class="edit-btn" title="Редактировать">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="delete-btn" title="Удалить">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;

        // Назначаем обработчики динамически
        card.querySelector(".edit-btn").onclick = () => window.editExercise(ex.id, ex.exerciseName, ex.weight, ex.approaches);
        card.querySelector(".delete-btn").onclick = () => window.deleteExercise(ex.id);

        container.appendChild(card);
    });
}

// ========== МОДАЛЬНЫЕ ОКНА (Глобальные функции) ==========
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("active");
};

window.closeModalWindow = function() {
    document.querySelectorAll(".modal-overlay, .modal").forEach(m => m.classList.remove("active"));
};

window.openAddModal = function() {
    window.openModal("modalOverlay");
};

window.deleteExercise = function(id) {
    currentDeleteId = id; // Запоминаем ID во внешнюю переменную
    window.openModal("deleteModal"); // Открываем окно подтверждения
};

window.editExercise = function(id, name, weight, approaches) {
    currentEditExerciseId = id; 
    
    
    const nameInput = document.getElementById("edit-exercise-name");
    const weightInput = document.getElementById("edit-exercise-weight");
    const setsInput = document.getElementById("edit-exercise-approaches");

   
    if (nameInput) nameInput.value = name || "";
    if (weightInput) weightInput.value = weight || "";
    if (setsInput) setsInput.value = approaches || "";

    window.openModal("editExerciseModal"); 
};

// ========== API ЗАПРОСЫ ==========

async function addNewTask() {
    const activeDayCard = document.querySelector(".day-card.active");
    if (!activeDayCard) return alert("Пожалуйста, выберите день недели");

    const selectedDay = activeDayCard.getAttribute("data-day");
    const taskData = {
        day: selectedDay,
        exerciseName: document.getElementById("exerciseName").value.trim(),
        weight: parseInt(document.getElementById("exerciseWeight").value) || 0,
        approaches: parseInt(document.getElementById("exerciseSets").value) || 0
    };

    if (!taskData.exerciseName) return alert("Введите название");

    try {
        const response = await authFetch("/trainingPlan/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskData)
        });

        if (response.ok) {
            window.closeModalWindow();
            await loadExercisesForDay(selectedDay);
            // Очистка полей
            document.getElementById("exerciseName").value = "";
            document.getElementById("exerciseWeight").value = "";
            document.getElementById("exerciseSets").value = "";
        }
    } catch (err) {
        console.error("Ошибка при добавлении:", err);
    }
}

async function submitEditTask() {
    if (!currentEditExerciseId) return;

    const taskData = {
        exerciseName: document.getElementById("edit-exercise-name").value.trim(),
        weight: parseInt(document.getElementById("edit-exercise-weight").value) || 0,
        approaches: parseInt(document.getElementById("edit-exercise-approaches").value) || 0
    };

    if (!taskData.exerciseName) return alert("Введите название упражнения");

    try {
        const response = await authFetch(`/trainingPlan/edit/${currentEditExerciseId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskData)
        });

        if (response.ok) {
            window.closeModalWindow();
      
            const activeDay = document.querySelector(".day-card.active")?.getAttribute("data-day");
            if (activeDay) {
                await loadExercisesForDay(activeDay);
            }
        }
    } catch (err) {
        console.error("Ошибка при редактировании:", err);
    }
}

async function confirmDelete() {
    if (!currentDeleteId) return;

    try {
        const response = await authFetch(`/trainingPlan/delete/${currentDeleteId}`, {
            method: "DELETE"
        });

        if (response.ok) {
            window.closeModalWindow(); // Закрываем модалку
            
            // Получаем текущий активный день, чтобы обновить список
            const activeDay = document.querySelector(".day-card.active")?.getAttribute("data-day");
            if (activeDay) {
                await loadExercisesForDay(activeDay);
            } else {
                location.reload(); // Фолбэк, если день не найден
            }
        } else {
            alert("Ошибка при удалении упражнения");
        }
    } catch (err) {
        console.error("Ошибка запроса на удаление:", err);
    } finally {
        currentDeleteId = null; // Очищаем ID в любом случае
    }
}

// ========== СЛУШАТЕЛИ СОБЫТИЙ ==========
function setupModalListeners() {
    // Закрытие по клику на оверлей
    const overlays = document.querySelectorAll(".modal-overlay");
    overlays.forEach(overlay => {
        overlay.addEventListener("click", function(e) {
            if (e.target === this) window.closeModalWindow();
        });
    });

    // Закрытие по Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") window.closeModalWindow();
    });

    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", confirmDelete);
    }
    // Кнопки действий
    document.getElementById("saveBtn")?.addEventListener("click", addNewTask);
    document.getElementById("confirmEditBtn")?.addEventListener("click", submitEditTask);
    document.getElementById("confirmDeleteBtn")?.addEventListener("click", confirmDelete);
}