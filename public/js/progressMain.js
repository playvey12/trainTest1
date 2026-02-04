let weightData = {
    userWeight: 0,
    userStartWeight: 0,
    userGoalWeight: 0,
    weightHistory: []
};

let mainChartInstance = null; // Переменная для хранения графика

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Загружаем общие данные пользователя (вес, цели)
    await refreshData();
    
    // 2. Инициализируем управление весом и модалки
    setupWeightControls();
    setupModalLogic();
    
    // 3. Загружаем список упражнений и строим график
    if (typeof Chart !== 'undefined') {
        await loadExercisesList(); // Сначала список
        setupChartListeners();     // Потом слушатели событий
    } else {
        console.error("Chart.js не подключен!");
    }
});

// --- 1. ГРАФИКИ И УПРАЖНЕНИЯ ---

// Загрузка списка упражнений в Select
async function loadExercisesList() {
    const exerciseSelect = document.getElementById('exercise-select');
    if (!exerciseSelect) return;

    try {
        const response = await window.auth.authFetch('/progressMain/unique-exercises');
        const data = await response.json();

        if (data.success && data.exercises && data.exercises.length > 0) {
            // Генерируем опции
            exerciseSelect.innerHTML = data.exercises
                .map(ex => `<option value="${ex}">${ex}</option>`)
                .join('');
            
            // Сразу загружаем график для первого упражнения в списке
            updateMainChart(); 
        } else {
            exerciseSelect.innerHTML = '<option value="" disabled>История пуста</option>';
        }
    } catch (e) {
        console.error("Ошибка загрузки списка упражнений:", e);
        exerciseSelect.innerHTML = '<option value="" disabled>Ошибка загрузки</option>';
    }
}

// Настройка слушателей изменений (select)
function setupChartListeners() {
    const exerciseSelect = document.getElementById('exercise-select');
    const periodSelect = document.getElementById('period-select');

    if (exerciseSelect) exerciseSelect.addEventListener('change', updateMainChart);
    if (periodSelect) periodSelect.addEventListener('change', updateMainChart);
}

// Функция обновления данных графика
async function updateMainChart() {
    const exerciseSelect = document.getElementById('exercise-select');
    const periodSelect = document.getElementById('period-select');
    const ctx = document.getElementById('mainProgressChart');

    if (!exerciseSelect || !periodSelect || !ctx) return;

    const exerciseName = exerciseSelect.value;
    const period = periodSelect.value;

    if (!exerciseName) return;

    try {
        // Запрос к серверу за историей
        const url = `/progressMain/exercise-history?exerciseName=${encodeURIComponent(exerciseName)}&period=${period}`;
        const response = await window.auth.authFetch(url);
        
        if (response.ok) {
            const data = await response.json();
            renderChart(ctx, data.history || []);
        }
    } catch (e) {
        console.error("Ошибка получения данных графика:", e);
    }
}

// Отрисовка Chart.js
function renderChart(ctx, historyData) {
    const labels = historyData.map(item => {
        const d = new Date(item.date);
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    });
    
    const dataPoints = historyData.map(item => item.weight);

    // 1. Если график УЖЕ существует — просто обновляем его данные
    if (mainChartInstance) {
        mainChartInstance.data.labels = labels;
        mainChartInstance.data.datasets[0].data = dataPoints;
        
        // Метод update() делает переход супер-плавным
        mainChartInstance.update({
            duration: 800,
            easing: 'easeInOutQuart'
        });
        return; 
    }

    // 2. Если графика еще нет — создаем его один раз (первый запуск)
    const chartContext = ctx.getContext('2d');
    const gradient = chartContext.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(255, 59, 92, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 59, 92, 0.0)');

    mainChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Рабочий вес (кг)',
                data: dataPoints,
                borderColor: '#ff3b5c',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#1e1e2e',
                pointBorderColor: '#ff3b5c',
                pointRadius: 5,
                pointHoverRadius: 8,
                fill: true,
                tension: 0.4 // Плавность кривой
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // Настройка анимации появления при первой загрузке
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#8e8e93', font: { family: 'Montserrat' } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#8e8e93', font: { family: 'Montserrat' } }
                }
            }
        }
    });
}


// --- 2. ОСТАЛЬНОЙ КОД (ВЕС ПОЛЬЗОВАТЕЛЯ, МОДАЛКИ) ---
// ... (Оставляешь свой код setupWeightControls, setupModalLogic, refreshData без изменений)
// Просто скопируй старые функции refreshData, setupWeightControls, setupModalLogic, renderWeightHistory сюда ниже
// или оставь как есть, если они в этом же файле.

async function refreshData() {
    try {
        const response = await window.auth.authFetch('/progressMain/userData');
        const data = await response.json();

        weightData.userWeight = data.userWeight || 0;
        weightData.userStartWeight = data.userStartWeight || 0;
        weightData.userGoalWeight = data.userGoalWeight || 0;
        weightData.weightHistory = data.weightHistory || [];
        
        updateUI(); 
        renderWeightHistory(weightData.weightHistory); 
        
    } catch (error) {
        console.error("Ошибка в refreshData:", error);
    }
}

function updateUI() {
    const weightDisplay = document.querySelector('.weight-value');
    if (weightDisplay) weightDisplay.textContent = `${Number(weightData.userWeight).toFixed(1)} кг`;
    
    const slider = document.querySelector('.weight-slider');
    if (slider) slider.value = weightData.userWeight;

    const lStart = document.getElementById('label-start-weight');
    const lGoal = document.getElementById('label-goal-weight');
    if (lStart) lStart.textContent = `${weightData.userStartWeight} кг`;
    if (lGoal) lGoal.textContent = `${weightData.userGoalWeight} кг`;
}

// ... (остальные функции setupWeightControls, setupModalLogic, renderWeightHistory оставляем как были у тебя)

function setupWeightControls() {
    const weightDisplay = document.querySelector('.weight-value');
    const slider = document.querySelector('.weight-slider');
    const minusBtn = document.querySelector('.weight-btn.minus');
    const plusBtn = document.querySelector('.weight-btn.plus');
    const confirmBtn = document.querySelector('.confirm-weight-btn');

    const updateValue = (val) => {
        val = parseFloat(val).toFixed(1);
        weightData.userWeight = parseFloat(val);
        if (weightDisplay) weightDisplay.textContent = `${val} кг`;
        if (slider) slider.value = val;
    };

    minusBtn?.addEventListener('click', () => updateValue(weightData.userWeight - 0.1));
    plusBtn?.addEventListener('click', () => updateValue(weightData.userWeight + 0.1));
    slider?.addEventListener('input', (e) => updateValue(e.target.value));

   confirmBtn?.addEventListener('click', async () => {
    try {
        const response = await window.auth.authFetch('/progressMain/edit', {
            method: 'PUT',
            body: JSON.stringify({ userWeight: weightData.userWeight })
        });
        
        if (response.ok) {
            window.auth.showNotification('Вес сохранен!', 'success');
            await refreshData(); 
        } else {
            const err = await response.json();
            window.auth.showNotification(err.error || 'Ошибка сохранения', 'error');
        }
    } catch (e) { 
        window.auth.showNotification('Сервер недоступен', 'error');
    }
   });
}

function setupModalLogic() {
    const modal = document.getElementById('settingsModal');
    const openBtn = document.querySelector('.settings-btn');
    const closeBtn = document.querySelector('.close-modal');
    const saveBtn = document.getElementById('saveSettings');

    openBtn?.addEventListener('click', () => {
        const startInput = document.getElementById('startWeight');
        const goalInput = document.getElementById('targetWeight');
        if (startInput) startInput.value = weightData.userStartWeight;
        if (goalInput) goalInput.value = weightData.userGoalWeight;
        if (modal) modal.classList.add('active');
    });

    closeBtn?.addEventListener('click', () => modal && modal.classList.remove('active'));

    saveBtn?.addEventListener('click', async () => {
        const startVal = parseFloat(document.getElementById('startWeight').value);
        const goalVal = parseFloat(document.getElementById('targetWeight').value);

        try {
            const res1 = await window.auth.authFetch('/progressMain/startWeight/edit', {
                method: 'PUT',
                body: JSON.stringify({ userStartWeight: startVal })
            });
            const res2 = await window.auth.authFetch('/progressMain/goalWeight/edit', {
                method: 'PUT',
                body: JSON.stringify({ userGoalWeight: goalVal })
            });

            if (res1.ok && res2.ok) {
                window.auth.showNotification('Цели обновлены!', 'success');
                modal.classList.remove('active');
                await refreshData();
            }
        } catch (e) {
            console.error(e);
        }
    });
}

function renderWeightHistory(history) {
    const container = document.getElementById('weightBarContainer');
    const labelsContainer = document.getElementById('weightBarLabels');
    const minWeightEl = document.getElementById('min-weight-display');
    const avgWeightEl = document.getElementById('avg-weight-display');

    if (!container || !labelsContainer) return;

    container.innerHTML = '';
    labelsContainer.innerHTML = '';

    const sortedHistory = [...history]
        .filter(d => d.weight && !isNaN(parseFloat(d.weight)))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const last7Days = sortedHistory.slice(-7);
    
    if (last7Days.length === 0) {
        if (minWeightEl) minWeightEl.textContent = '-- кг';
        if (avgWeightEl) avgWeightEl.textContent = '-- кг';
        return;
    }

    const weights = last7Days.map(d => parseFloat(d.weight));
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;

    if (minWeightEl) minWeightEl.textContent = `${minW.toFixed(1)} кг`;
    if (avgWeightEl) avgWeightEl.textContent = `${avgWeight.toFixed(1)} кг`;

    last7Days.forEach((entry, index) => {
        // 1. Создаем обертку
        const barWrapper = document.createElement('div');
        barWrapper.className = 'bar-wrapper';

        // 2. Создаем цифру над столбиком (с нулевой прозрачностью для анимации)
        const barValue = document.createElement('span');
        barValue.className = 'bar-value';
        barValue.textContent = Number(entry.weight).toFixed(1);
        barValue.style.opacity = '0';
        barValue.style.transition = 'opacity 0.5s ease-out';
        barValue.style.transitionDelay = `${index * 0.1 + 0.4}s`; // Появится после того, как вырастет столбик

        // 3. Создаем столбик
        const bar = document.createElement('div');
        bar.className = 'bar' + (index === last7Days.length - 1 ? ' active' : '');
        bar.style.height = '0%'; // Начальная высота для анимации

        // 4. Расчет "красивой" высоты
        // Чтобы график не был плоским, если веса почти одинаковые
        let heightPercent;
        if (maxW === minW) {
            heightPercent = 60;
        } else {
            // Масштабируем: минимальный вес в истории = 20% высоты, максимальный = 90%
            heightPercent = 20 + ((entry.weight - minW) / (maxW - minW)) * 70;
        }

        // 5. Собираем в DOM
        barWrapper.appendChild(barValue);
        barWrapper.appendChild(bar);
        container.appendChild(barWrapper);

        // 6. Подпись даты
        const dateObj = new Date(entry.date);
        const span = document.createElement('span');
        span.textContent = !isNaN(dateObj.getTime()) 
            ? dateObj.toLocaleDateString('ru-RU', {day:'2-digit', month:'2-digit'})
            : '??.??';
        labelsContainer.appendChild(span);

        // 7. ЗАПУСК АНИМАЦИИ (с каскадным эффектом)
        requestAnimationFrame(() => {
            setTimeout(() => {
                bar.style.height = `${heightPercent}%`;
                barValue.style.opacity = '1';
            }, index * 100); // Каждый следующий столбик начинает расти на 100мс позже
        });
    });
}