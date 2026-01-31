document.addEventListener("DOMContentLoaded", function () {
    // === 1. Инициализация и переменные ===
    if (!window.auth || !window.auth.checkAuth()) return;
    window.auth.initTheme();

    // ВЫЗЫВАЕМ ФУНКЦИИ СРАЗУ ПРИ ЗАГРУЗКЕ
    updateSessionDate();
    updateRemainingStats();
    // DOM Элементы (Кнопки)
    const selectDayBtn = document.getElementById("select-day-btn");
    const startWorkoutBtn = document.getElementById("start-workout-btn");
    const finishWorkoutBtn = document.getElementById("finish-workout-btn");
    
    // Модальные окна
    const dayModal = document.getElementById("day-modal");
    const confirmModal = document.getElementById("confirm-modal");
    const resultsModal = document.getElementById("results-modal");
    
    // Элементы внутри модалок
    const closeModalBtns = document.querySelectorAll(".close-modal, #cancel-confirm-btn");
    const dayOptions = document.querySelectorAll(".day-option");
    const confirmFinishBtn = document.getElementById("confirm-finish-btn");
    const closeResultsBtn = document.getElementById("close-results-btn");

    // Таймер и данные
    const timerHours = document.querySelectorAll(".timer-value")[0]; // Часы
    const timerMinutes = document.querySelectorAll(".timer-value")[1]; // Минуты
    const timerSeconds = document.querySelectorAll(".timer-value")[2]; // Секунды
    
    let workoutTimer = null;
    let workoutSeconds = 0;
    let totalRestTime = 0;
    let isWorkoutStarted = false;
    let activeRestTimer = null; // Таймер отдыха для кнопки

    // Константы
    const REST_DURATION = 3; // Время отдыха в секундах

    // === 2. Обработчики событий (Listeners) ===

    // Открытие выбора дня
    if (selectDayBtn) {
        selectDayBtn.addEventListener("click", () => openModal(dayModal));
    }

    
    // Клик по дню (Редирект на страницу дня)
    dayOptions.forEach(btn => {
    btn.addEventListener("click", function() {
        const day = this.getAttribute("data-day");
        // 1. Достаем токен из хранилища
        const token = localStorage.getItem('token'); 
        
        if (day && token) {
            // 2. Добавляем токен прямо в ссылку
            window.location.href = `/trainMode/day/${day}?token=${token}`;
        } else {
            // Если токена нет - отправляем на логин
            window.location.href = '/login';
        }
    });
});

    // Начать тренировку
    if (startWorkoutBtn) {
        startWorkoutBtn.addEventListener("click", function() {
            startWorkout();
        });
    }

    // Завершить тренировку (открыть подтверждение)
    if (finishWorkoutBtn) {
        finishWorkoutBtn.addEventListener("click", function() {
            openModal(confirmModal);
            stopTimer(); // Пауза таймера пока думаем
        });
    }

    // Подтверждение завершения
    if (confirmFinishBtn) {
        confirmFinishBtn.addEventListener("click", function() {
            closeModal(confirmModal);
            finishWorkout();
        });
    }

    // Закрытие модалок
    closeModalBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            closeModal(dayModal);
            closeModal(confirmModal);
            // Если отменили завершение, возобновляем таймер
            if (isWorkoutStarted && !workoutTimer) {
                startTimer();
            }
        });
    });

   if (closeResultsBtn) {
    closeResultsBtn.addEventListener("click", () => {
        closeModal(resultsModal);
        
    
        const token = localStorage.getItem('token');
        
        if (token) {
           
            window.location.href = `/trainMode?token=${token}`;
        } else {
            
            window.location.href = '/login';
        }
    });
}

    // Делегирование событий для кнопок "Выполнено" (так как карточки меняются динамически)
    const exercisesContainer = document.getElementById("exercises-wrapper");
    if (exercisesContainer) {
        exercisesContainer.addEventListener("click", handleExerciseAction);
    }
let currentEditExerciseId = null; 

// В обработчике клика по кнопке "Сохранить в график"
if (exercisesContainer) {
    exercisesContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-mini-action-save");
        if (!btn) return;

        const exerciseCard = btn.closest("[class*='exercise-card']");
        
        // ВАЖНО: Берем ID из атрибута карточки
        currentEditExerciseId = exerciseCard.getAttribute("data-exercise-id") || 
                               btn.closest(".complete-btn")?.getAttribute("data-id");
        
        currentExerciseForGraph = exerciseCard.querySelector(".exercise-title").textContent;
        
        weightModalExerciseName.textContent = `Упражнение: ${currentExerciseForGraph}`;
        weightInput.value = ""; 
        openModal(weightModal);
    });
}
    // === 3. Логика Тренировки ===

    function startWorkout() {
    if (isWorkoutStarted) return;
    
    isWorkoutStarted = true;
    updateSessionDate(); // Обновить дату
    updateRemainingStats(); // Обновить счетчик
    startWorkoutBtn.style.display = 'none'; 
    finishWorkoutBtn.disabled = false;
    finishWorkoutBtn.style.opacity = "1";
    
    // Разблокируем ВСЕ кнопки действий (и галочку, и график)
    const actionBtns = document.querySelectorAll(".complete-btn, .btn-mini-action-save");
    actionBtns.forEach(btn => {
        btn.classList.remove("btn-disabled");
        btn.disabled = false;
        btn.style.opacity = "1";
    });

    startTimer();
    window.auth.showNotification("Тренировка началась!", "success");
}

// В вашем основном скрипте тренировки

async function finishWorkout() {
    stopTimer();
    
    // Рассчитываем параметры
    const hoursSpent = parseFloat((workoutSeconds / 3600).toFixed(2)); 
    const isFullWorkout = workoutSeconds >= 1800; 

    try {
        
        const response = await window.auth.authFetch('/profileMain/updateStats', {
            method: 'POST',
            body: JSON.stringify({
                addWorkout: isFullWorkout,
                hoursToAdd: hoursSpent
            })
        });

        if (!response.ok) throw new Error("Failed to save stats");

        const formattedTime = formatTimeStruct(workoutSeconds);
        const formattedRest = formatTimeStruct(totalRestTime);
        
        document.getElementById("total-time-result").textContent = formattedTime;
        document.getElementById("rest-time-result").textContent = formattedRest;
        
        openModal(resultsModal);

    } catch (error) {
        console.error(error);
        window.auth.showNotification("Ошибка при сохранении статистики", "error");
    }
}

    // Обработка клика по кнопке выполнения подхода
    async function handleExerciseAction(e) {
    const btn = e.target.closest(".complete-btn");
    if (!btn) return;

    if (!isWorkoutStarted) {
        window.auth.showNotification("Сначала нажмите 'Начать тренировку'", "info");
        return;
    }

    if (btn.classList.contains("rest-active")) return;

    e.preventDefault();

    const exerciseCard = btn.closest(".exercise-card-active");
    const weightDisplay = exerciseCard.querySelector(".weight-value");
    const approachesElem = exerciseCard.querySelector(".approaches-value");
    
    // --- НОВАЯ ЛОГИКА ОБРАБОТКИ ВЕСОВ ---
    
    // 1. Получаем строку весов из атрибута (например, "60,65,70")
    let weightAttr = btn.getAttribute("data-weight");
    let weightArray = weightAttr.split(',').map(w => w.trim());

    // 2. Определяем текущий индекс подхода
    // Вычисляем его как: (Всего подходов - Осталось подходов)
    // Если в массиве 3 веса, и осталось 3 -> индекс 0. Осталось 2 -> индекс 1.
    const totalSets = weightArray.length;
    let remainingSets = parseInt(approachesElem.textContent);
    const currentIndex = totalSets - remainingSets;

    // 3. Берем текущий вес для этого подхода
    const currentWeight = weightArray[currentIndex] || weightArray[weightArray.length - 1];

    try {
        // Отправляем на сервер именно текущий вес
        await logProgress(exerciseCard.querySelector(".exercise-title").textContent, currentWeight);
        
        remainingSets--;
        
        if (remainingSets > 0) {
            approachesElem.textContent = remainingSets;
            
            // 4. Обновляем визуальный вес на карточке для СЛЕДУЮЩЕГО подхода
            const nextWeight = weightArray[currentIndex + 1] || currentWeight;
            if (weightDisplay) {
                weightDisplay.textContent = nextWeight;
                // Добавим легкую анимацию смены цифры
                weightDisplay.classList.add('fade-in'); 
                setTimeout(() => weightDisplay.classList.remove('fade-in'), 500);
            }

            startRestTimerForButton(btn);
        } else {
            approachesElem.textContent = "0";
            completeExerciseAndSwap(exerciseCard);
        }
    } catch (error) {
        console.error(error);
        window.auth.showNotification("Ошибка сохранения", "error");
    }
}
function updateRemainingStats() {
    const statsElem = document.getElementById("remaining-exercises-display");
    if (!statsElem) return;

    // Считаем активную карточку (0 или 1)
    const activeCount = document.querySelectorAll(".exercise-card-active").length;
    // Считаем карточки в очереди
    const queueCount = document.querySelectorAll(".exercise-card-mini").length;
    
    const totalRemaining = activeCount + queueCount;

    // Выбираем правильное склонение (Упражнение, Упражнения, Упражнений)
    let word = "упражнений";
    if (totalRemaining === 1) word = "упражнение";
    else if (totalRemaining > 1 && totalRemaining < 5) word = "упражнения";

    statsElem.textContent = `${totalRemaining} ${word} осталось`;
}
function updateSessionDate() {
    const dateElem = document.getElementById("current-date-display");
    if (!dateElem) return;

    const now = new Date();
    // Форматируем дату (например: "Понедельник, 31 янв.")
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    const formattedDate = now.toLocaleDateString('ru-RU', options);
    
    // Делаем первую букву заглавной
    dateElem.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}
    // Таймер отдыха на кнопке
    function startRestTimerForButton(btn) {
        let timeLeft = REST_DURATION;
        const originalIcon = btn.innerHTML;
        
        btn.classList.add("rest-active");
        btn.disabled = true;
        btn.style.opacity = "0.7";
        
        // Меняем иконку на таймер
        btn.innerHTML = `<span style="font-size:12px; font-weight:bold;">${timeLeft}</span>`;

        const interval = setInterval(() => {
            timeLeft--;
            btn.innerHTML = `<span style="font-size:12px; font-weight:bold;">${timeLeft}</span>`;
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                totalRestTime += REST_DURATION; // Добавляем к общему отдыху
                
                // Возвращаем кнопку в исходное состояние
                btn.innerHTML = originalIcon;
                btn.classList.remove("rest-active");
                btn.disabled = false;
                btn.style.opacity = "1";
                window.auth.showNotification("Отдых завершен!", "success");
            }
        }, 1000);
    }

// Переменные для новой модалки
const weightModal = document.getElementById("weight-modal");
const weightInput = document.getElementById("weight-input");
const saveWeightBtn = document.getElementById("save-weight-btn");
const weightModalExerciseName = document.getElementById("weight-modal-exercise-name");

let currentExerciseForGraph = ""; // Здесь будем хранить имя упражнения

// 1. Обработка клика по кнопке "Сохранить в график"
// Используем делегирование через exercisesContainer, который у тебя уже есть
if (exercisesContainer) {
    exercisesContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-mini-action-save");
        if (!btn) return;
if (!isWorkoutStarted) {
            window.auth.showNotification("Сначала нажмите 'Начать тренировку'", "info");
            return;
        }
        const exerciseCard = btn.closest("[class*='exercise-card']");
        currentEditExerciseId = exerciseCard.getAttribute("data-exercise-id");
        currentExerciseForGraph = exerciseCard.querySelector(".exercise-title").textContent;
        
        weightModalExerciseName.textContent = `Упражнение: ${currentExerciseForGraph}`;
        weightInput.value = ""; 
        openModal(weightModal);
    });
}

// 2. Закрытие модалки веса
document.getElementById("close-weight-modal")?.addEventListener("click", () => closeModal(weightModal));

// 3. Логика кнопки "Сохранить" в модалке
saveWeightBtn.addEventListener("click", async () => {
    const weight = weightInput.value;

    if (!weight || weight <= 0) {
        window.auth.showNotification("Введите корректный вес", "error");
        return;
    }

    try {
        // Вызываем функцию отправки (подготовим её ниже)
        await saveWeightToGraph(currentExerciseForGraph, weight);
        
        closeModal(weightModal);
        window.auth.showNotification("Данные для графика сохранены!", "success");
    } catch (error) {
        window.auth.showNotification("Ошибка при сохранении", "error");
    }
});

// 4. Функция-заглушка для отправки на сервер
async function saveWeightToGraph(exerciseName, weight) {
    if (!currentEditExerciseId) {
        window.auth.showNotification("Не удалось определить ID упражнения", "error");
        return;
    }

    try {
        const taskData = {
            weight: parseInt(weight) || 0,
            exerciseName: exerciseName 
            // Если валидатор на сервере требует подходы/повторения, 
            // их нужно вытащить из DOM и добавить сюда
        };

        // Путь должен быть строго как в роутере: /trainMode/saveToGraph/:id
        const response = await window.auth.authFetch(`/trainMode/saveToGraph/${currentEditExerciseId}`, {
            method: "PUT",
            body: JSON.stringify(taskData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Ошибка сервера");
        }
        return true;
    } catch (error) {
        console.error("Ошибка при сохранении веса:", error);
        throw error;
    }
}

    // Логика смены упражнений (Самое сложное)
   function completeExerciseAndSwap(activeCard) {
    // 1. Добавляем класс анимации исчезновения
    activeCard.classList.add("removing");

    // 2. Ждем, пока активная карточка начнет исчезать, прежде чем двигать очередь
    setTimeout(() => {
        const scrollContainer = document.querySelector(".exercises-scroll-container");
        const nextMiniCard = scrollContainer ? scrollContainer.querySelector(".exercise-card-mini") : null;

        if (nextMiniCard) {
            // Эффект для мини-карточки, что она "взлетает" на место главной
            nextMiniCard.classList.add("scaling-up");

            setTimeout(() => {
                activeCard.remove(); // Удаляем старую
                updateRemainingStats();
                const nextData = {
                    id: nextMiniCard.getAttribute("data-exercise-id"),
                    name: nextMiniCard.getAttribute("data-name"),
                    weight: nextMiniCard.getAttribute("data-weight"),
                    approaches: nextMiniCard.getAttribute("data-approaches")
                };

                const newActiveHTML = generateActiveCardHTML(nextData);
                const queueSection = document.querySelector(".queue-section");
                
                // Вставляем новую карточку. Класс .fade-in запустит анимацию появления из CSS
                queueSection.insertAdjacentHTML('beforebegin', newActiveHTML);
                
                nextMiniCard.remove(); // Удаляем мини-версию
                
                // Если нужно разблокировать кнопки (так как тренировка уже идет)
                const newCard = document.querySelector(`.exercise-card-active[data-exercise-id="${nextData.id}"]`);
                if (newCard) {
                    const btns = newCard.querySelectorAll(".complete-btn, .btn-mini-action-save");
                    btns.forEach(b => {
                        b.classList.remove("btn-disabled");
                        b.disabled = false;
                        b.style.opacity = "1";
                    });
                }
            }, 300); // Задержка для эффекта scaling-up
        } else {
            // Если упражнений больше нет
            setTimeout(() => {
                activeCard.remove();
                window.auth.showNotification("Все упражнения выполнены! Огонь! 🔥", "success");
            }, 400);
        }
    }, 400); // Время совпадает с transition в CSS (0.5s)
}

    // Генератор HTML для активной карточки
  function generateActiveCardHTML(data) {
    // 1. Обработка веса (аналог вашего хелпера getFirstWeight)
    // Если в data.weight пришла строка "60, 65, 70", берем "60"
    const weightArray = String(data.weight).split(',').map(w => w.trim());
    const firstWeight = weightArray[0] || "0";

    return `
    <div class="exercise-card-active fade-in" data-exercise-id="${data.id}">
        <div class="card-header">
            <span class="badge-active">ТЕКУЩЕЕ УПРАЖНЕНИЕ</span>
            <i class="fas fa-dumbbell red-icon"></i>
        </div>

        <h2 class="exercise-title">${data.name}</h2>

        <div class="stats-grid">
            <div class="stat-box">
                <span class="stat-label">ВЕС (КГ)</span>
                <div class="stat-value">
                    <span class="weight-value">${firstWeight}</span>
                    <span class="unit">КГ</span>
                </div>
            </div>
            <div class="stat-box">
                <span class="stat-label">ПОДХОДЫ</span>
                <div class="stat-value">
                    <span class="approaches-value">${data.approaches}</span>
                    <span class="unit">ОСТАЛОСЬ</span>
                </div>
            </div>
        </div>

        <div class="action-buttons-row">
            <button class="btn-mini-action btn-mini-action-save">
                <i class="fas fa-chart-line">
                    <span>Сохранить в график</span>
                </i>
            </button>

            <button class="btn-confirm complete-btn" data-id="${data.id}" data-weight="${data.weight}">
                <i class="fas fa-check-circle"></i>
            </button>
        </div>
    </div>`;
}

    // === 4. Утилиты ===

    async function logProgress(name, weight) {
        const response = await window.auth.authFetch('/progressMain/log-exercise', {
            method: 'POST',
            body: JSON.stringify({
                exerciseName: name,
                weight: parseInt(weight) || 0
            })
        });
        if (!response.ok) throw new Error("Server error");
        return await response.json();
    }

    function startTimer() {
        if (workoutTimer) clearInterval(workoutTimer);
        workoutTimer = setInterval(() => {
            workoutSeconds++;
            updateTimerDisplay();
        }, 1000);
    }

    function stopTimer() {
        if (workoutTimer) {
            clearInterval(workoutTimer);
            workoutTimer = null;
        }
    }

    function updateTimerDisplay() {
        const h = Math.floor(workoutSeconds / 3600);
        const m = Math.floor((workoutSeconds % 3600) / 60);
        const s = workoutSeconds % 60;

        if (timerHours) timerHours.textContent = h.toString().padStart(2, "0");
        if (timerMinutes) timerMinutes.textContent = m.toString().padStart(2, "0");
        if (timerSeconds) timerSeconds.textContent = s.toString().padStart(2, "0");
    }

    function formatTimeStruct(totalSecs) {
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }

    function openModal(modal) {
        if (modal) modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeModal(modal) {
        if (modal) modal.classList.remove("active");
        document.body.style.overflow = "auto";
    }
    
    // Блокируем кнопки при загрузке, если тренировка не начата
    // Блокируем кнопки при загрузке, если тренировка не начата
if (selectDayBtn === null) { 
    // Находим и основные кнопки завершения, и кнопки сохранения в график
    const actionBtns = document.querySelectorAll(".complete-btn, .btn-mini-action-save");
    actionBtns.forEach(btn => {
        btn.classList.add("btn-disabled");
        btn.disabled = true;
        btn.style.opacity = "0.5"; // Визуально приглушаем
    });
}
});