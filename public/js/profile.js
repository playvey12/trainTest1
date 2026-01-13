function resetUrl2() {
  document.location = "./profileMain";
}

const currentWeightElement = document.getElementById("current-weight");
const startWeightElement = document.getElementById("start-weight");
const goalWeightElement = document.getElementById("goal-weight");

const scaleProgress = document.getElementById("scale-progress");
const currentMarker = document.getElementById("current-marker");
const decreaseBtn = document.getElementById("decrease-btn");
const increaseBtn = document.getElementById("increase-btn");
const confirmBtn = document.getElementById("confirm-weight");
const selectElementForWeightChart = document.getElementById('time-period');
const weightChartCanvas = document.getElementById('weightChart');
const selectElement = document.getElementById('period-select');
const ctx = document.getElementById('myChart');
const themeButtons = {
  pink: document.querySelector('.theme-pink'),
  black: document.querySelector('.theme-dark'),
};
const bodyProf = document.querySelector('body');

let weightData = {
  userName: "",
  userWeight: 0,
  userStartWeight: 0,
  userGoalWeight: 0,
  userWeightChange: 0,
  userWeightToGoal: 0,
  weightHistory: []
};

let weightProgressChart = null;
let chart = null;
let exerciseChart = null;

// ========== ФУНКЦИИ ДЛЯ АВТОРИЗАЦИИ И ВЫХОДА ==========
function logout() {
  clearToken();
  showNotification("Успешный выход из профиля", "error");
   setTimeout(() => {
        window.location.href = '/register';
      }, 1000);
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ДАННЫМИ ВЕСА ==========
async function getWeightDataFromServer(period = '30days') {
  try {
    const response = await authFetch(`/profileMain?period=${period}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const serverData = await response.json();
    weightData.userWeight = serverData.profileWeightList?.userWeight || 0;
    weightData.userStartWeight = serverData.profileWeightList?.userStartWeight || 0;
    weightData.userGoalWeight = serverData.profileWeightList?.userGoalWeight || 0;
    weightData.userName = serverData.profileWeightList?.userName || "";
    weightData.weightHistory = serverData.weightHistory || [];
    weightData.userWeightChange = weightData.userWeight - weightData.userStartWeight;
    weightData.userWeightToGoal = weightData.userWeight - weightData.userGoalWeight;
    
    return true;
  } catch (error) {
    return false;
  }
}

async function getWeightDataFromHTML() {
  const serverSuccess = await getWeightDataFromServer();
  if (serverSuccess) return true;
  
  const weightDataElement = document.getElementById('weight-data');
  if (weightDataElement && weightDataElement.dataset) {
    weightData.userWeight = parseFloat(weightDataElement.dataset.currentWeight) || 70;
    weightData.userStartWeight = parseFloat(weightDataElement.dataset.startWeight) || 80;
    weightData.userGoalWeight = parseFloat(weightDataElement.dataset.goalWeight) || 65;
    weightData.userWeightChange = parseFloat(weightDataElement.dataset.weightChange) || -10;
    weightData.userWeightToGoal = parseFloat(weightDataElement.dataset.weightToGoal) || 5;
    return true;
  }
  
  try {
    if (currentWeightElement) {
      const match = currentWeightElement.textContent.trim().match(/(\d+(\.\d+)?)/);
      if (match) weightData.userWeight = parseFloat(match[1]);
    }
    if (startWeightElement) {
      const match = startWeightElement.textContent.trim().match(/(\d+(\.\d+)?)/);
      if (match) weightData.userStartWeight = parseFloat(match[1]);
    }
    if (goalWeightElement) {
      const match = goalWeightElement.textContent.trim().match(/(\d+(\.\d+)?)/);
      if (match) weightData.userGoalWeight = parseFloat(match[1]);
    }
    
    weightData.userWeightChange = weightData.userWeight - weightData.userStartWeight;
    weightData.userWeightToGoal = weightData.userWeight - weightData.userGoalWeight;
    return true;
  } catch (error) {
    return false;
  }
}

function updateWeightDisplay() {
  const userNameElements = document.querySelectorAll('.user-name-display, .username, .user-name, .profile-info h3, .user-info h2, .profile-header h2, #userNameDisplay');
  userNameElements.forEach(element => {
    if (element && weightData.userName) element.textContent = weightData.userName;
  });
  
  if (currentWeightElement) currentWeightElement.textContent = `${weightData.userWeight.toFixed(1)} кг`;
  if (startWeightElement) startWeightElement.textContent = `${weightData.userStartWeight.toFixed(1)} кг`;
  if (goalWeightElement) goalWeightElement.textContent = `${weightData.userGoalWeight.toFixed(1)} кг`;
  
  const statStartWeight = document.getElementById("stat-start-weight");
  const statCurrentWeight = document.getElementById("stat-current-weight");
  const statChange = document.getElementById("stat-change");
  const statToGoal = document.getElementById("stat-to-goal");
  
  if (statStartWeight) statStartWeight.textContent = `${weightData.userStartWeight.toFixed(1)} кг`;
  if (statCurrentWeight) statCurrentWeight.textContent = `${weightData.userWeight.toFixed(1)} кг`;
  
  if (statChange) {
    const change = weightData.userWeightChange;
    statChange.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)} кг`;
    statChange.className = `stat-value ${change > 0 ? 'positive' : change < 0 ? 'negative' : ''}`;
  }
  
  if (statToGoal) {
    const toGoal = weightData.userWeightToGoal;
    statToGoal.textContent = `${toGoal > 0 ? '+' : ''}${toGoal.toFixed(1)} кг`;
    statToGoal.className = `stat-value ${toGoal > 0 ? 'positive' : toGoal < 0 ? 'negative' : ''}`;
  }
}

function calculateMarkerPosition(currentWeight, startWeight, goalWeight) {
  const minWeight = Math.min(startWeight, goalWeight);
  const maxWeight = Math.max(startWeight, goalWeight);
  if (maxWeight - minWeight === 0) return 50;
  let position = ((currentWeight - minWeight) / (maxWeight - minWeight)) * 100;
  return Math.max(0, Math.min(100, position));
}

function updateScale() {
  const startWeight = weightData.userStartWeight;
  const goalWeight = weightData.userGoalWeight;
  const currentWeight = weightData.userWeight;
  if (!startWeight || !goalWeight || !currentWeight) return;
  
  const isWeightLoss = startWeight > goalWeight;
  let progress;
  
  if (isWeightLoss) {
    const totalLoss = startWeight - goalWeight;
    const currentLoss = startWeight - currentWeight;
    progress = totalLoss > 0 ? Math.max(0, Math.min(100, (currentLoss / totalLoss) * 100)) : 0;
  } else {
    const totalGain = goalWeight - startWeight;
    const currentGain = currentWeight - startWeight;
    progress = totalGain > 0 ? Math.max(0, Math.min(100, (currentGain / totalGain) * 100)) : 0;
  }
  
  if (scaleProgress) scaleProgress.style.width = `${progress}%`;
  const markerPosition = calculateMarkerPosition(currentWeight, startWeight, goalWeight);
  if (currentMarker) currentMarker.style.left = `${markerPosition}%`;
}

function decreaseWeight() {
  const currentWeight = parseFloat(currentWeightElement.textContent);
  const newWeight = Math.max(0.1, currentWeight - 0.1);
  currentWeightElement.textContent = `${newWeight.toFixed(1)} кг`;
  weightData.userWeight = newWeight;
  weightData.userWeightChange = newWeight - weightData.userStartWeight;
  weightData.userWeightToGoal = newWeight - weightData.userGoalWeight;
  updateScale();
  updateWeightDisplay();
}

function increaseWeight() {
  const currentWeight = parseFloat(currentWeightElement.textContent);
  const newWeight = currentWeight + 0.1;
  currentWeightElement.textContent = `${newWeight.toFixed(1)} кг`;
  weightData.userWeight = newWeight;
  weightData.userWeightChange = newWeight - weightData.userStartWeight;
  weightData.userWeightToGoal = newWeight - weightData.userGoalWeight;
  updateScale();
  updateWeightDisplay();
}

function confirmWeight() {
  const newWeight = parseFloat(currentWeightElement.textContent);
  updateWeightDisplay();
  updateScale();
  editWeight(newWeight);
}

function setupLongPress(button, callback) {
  let pressTimer;
  button.addEventListener("mousedown", () => pressTimer = setInterval(callback, 150));
  button.addEventListener("mouseup", () => clearInterval(pressTimer));
  button.addEventListener("mouseleave", () => clearInterval(pressTimer));
  button.addEventListener("touchstart", () => pressTimer = setInterval(callback, 150));
  button.addEventListener("touchend", () => clearInterval(pressTimer));
}

function setupEventListeners() {
  if (decreaseBtn) {
    decreaseBtn.addEventListener("click", decreaseWeight);
    setupLongPress(decreaseBtn, decreaseWeight);
  }
  if (increaseBtn) {
    increaseBtn.addEventListener("click", increaseWeight);
    setupLongPress(increaseBtn, increaseWeight);
  }
  if (confirmBtn) confirmBtn.addEventListener("click", confirmWeight);
}

async function initWeightScale() {
  if (await getWeightDataFromHTML()) {
    updateWeightDisplay();
    updateScale();
    setupEventListeners();
    const period = selectElementForWeightChart?.value || '30days';
    await createOrUpdateWeightChart(period);
  }
}

// ========== ФУНКЦИИ ДЛЯ ГРАФИКОВ ==========
async function createOrUpdateWeightChart(period) {
  try {
    const labels = [];
    const data = [];
    
    if (weightData.weightHistory && weightData.weightHistory.length > 0) {
      const sortedHistory = [...weightData.weightHistory].sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp) : parseDateStringForChart(a.date);
        const dateB = b.timestamp ? new Date(b.timestamp) : parseDateStringForChart(b.date);
        return dateA - dateB;
      });
      
      function parseDateStringForChart(dateString) {
        if (!dateString) return new Date();
        const parts = dateString.split('.');
        if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
        return new Date(dateString);
      }
      
      sortedHistory.forEach(item => {
        labels.push(item.formattedDate || item.date);
        data.push(item.weight);
      });
    }
    
    if (data.length === 0 && weightData.userWeight > 0) {
      labels.push("Сегодня");
      data.push(weightData.userWeight);
    }
    
    const allWeights = [...data, weightData.userGoalWeight, weightData.userStartWeight].filter(w => w > 0);
    const minWeight = allWeights.length > 0 ? Math.min(...allWeights) * 0.9 : 50;
    const maxWeight = allWeights.length > 0 ? Math.max(...allWeights) * 1.1 : 100;
    const ctx = weightChartCanvas.getContext('2d');
    
    if (weightProgressChart) {
      weightProgressChart.data.labels = labels;
      weightProgressChart.data.datasets[0].data = data;
      weightProgressChart.options.scales.y.min = minWeight;
      weightProgressChart.options.scales.y.max = maxWeight;
      weightProgressChart.update();
    } else {
      weightProgressChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Вес (кг)',
            data: data,
            borderWidth: 2,
            borderColor: '#ff2d55',
            backgroundColor: 'rgba(255, 45, 85, 0.1)',
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#ff2d55',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: { color: '#ffffff', font: { size: 14, weight: 'bold' } }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#ff2d55',
              borderWidth: 1,
              callbacks: {
                label: context => `Вес: ${context.parsed.y.toFixed(1)} кг`,
                title: tooltipItems => `Дата: ${tooltipItems[0].label}`
              }
            }
          },
          scales: {
            x: {
              title: { display: true, text: 'Дата измерения', color: '#ffffff', font: { size: 14, weight: 'bold' } },
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              ticks: { color: '#ffffff' }
            },
            y: {
              beginAtZero: false,
              title: { display: true, text: 'Вес (кг)', color: '#ffffff', font: { size: 14, weight: 'bold' } },
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              ticks: { color: '#ffffff' },
              min: minWeight,
              max: maxWeight
            }
          },
          interaction: { intersect: false, mode: 'nearest' }
        }
      });
    }
    
    updateChartColorsForTheme();
  } catch (error) {
    if (weightChartCanvas) weightChartCanvas.innerHTML = '<div class="chart-error">Не удалось загрузить данные графика</div>';
  }
}

async function initWeightChart() {
  try {
    const initialPeriod = selectElementForWeightChart ? selectElementForWeightChart.value : '30days';
    await createOrUpdateWeightChart(initialPeriod);
    if (selectElementForWeightChart) {
      selectElementForWeightChart.addEventListener('change', async function() {
        await createOrUpdateWeightChart(this.value);
      });
    }
  } catch (error) {}
}

function generateLabels(period) {
  const labels = [];
  let daysCount = 0;
  switch(period) {
    case '3months': daysCount = 90; break;
    case '6months': daysCount = 180; break;
    case 'year': daysCount = 365; break;
    default: daysCount = 90;
  }
  for (let day = 14; day <= daysCount; day += 14) labels.push(`${day}`);
  return labels;
}

function generateData(labels) {
  return labels.map(label => Math.floor(parseInt(label) * 0.5 + Math.random() * 10));
}

function createOrUpdateChart(period) {
  const labels = generateLabels(period);
  const data = generateData(labels);
  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
  } else {
    chart = new Chart(ctx, {
      type: 'line',
      data: { labels: labels, datasets: [{
        label: 'Прогресс',
        data: data,
        borderWidth: 2,
        borderColor: '#ff2d55',
        backgroundColor: 'rgba(255, 45, 85, 0.1)',
        tension: 0.3,
        fill: true
      }]},
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: 'Дни' }, grid: { display: true } },
          y: { beginAtZero: true, title: { display: true, text: 'Вес' }, grid: { display: true } }
        }
      }
    });
  }
}

async function loadExerciseData(exerciseName, period = '3months') {
  try {
    const response = await authFetch(`/profileMain/exercise-history?exerciseName=${encodeURIComponent(exerciseName)}&period=${period}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function createOrUpdateExerciseChart(exerciseName, period = '3months') {
  try {
    const chartCanvas = document.getElementById('exerciseChart');
    if (!chartCanvas) return;
    
    const chartData = await loadExerciseData(exerciseName, period);
    const chartContainer = document.querySelector('.chart-container');
    const noDataMessage = document.getElementById('no-exercise-data');
    
    if (!chartData || !chartData.history || chartData.history.length === 0) {
      if (exerciseChart) exerciseChart.destroy();
      exerciseChart = null;
      if (chartContainer) chartContainer.style.display = 'none';
      if (noDataMessage) noDataMessage.style.display = 'block';
      return;
    }
    
    if (noDataMessage) noDataMessage.style.display = 'none';
    if (chartContainer) chartContainer.style.display = 'block';
    
    const labels = [];
    const weights = [];
    const sortedHistory = [...chartData.history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    sortedHistory.forEach(item => {
      labels.push(item.formattedDate || item.date);
      weights.push(item.weight);
    });
    
    const allWeights = weights.filter(w => w > 0);
    const minWeight = allWeights.length > 0 ? Math.min(...allWeights) * 0.9 : 0;
    const maxWeight = allWeights.length > 0 ? Math.max(...allWeights) * 1.1 : 100;
    const ctx = chartCanvas.getContext('2d');
    if (!ctx) return;
    
    if (exerciseChart) {
      exerciseChart.data.labels = labels;
      exerciseChart.data.datasets[0].data = weights;
      exerciseChart.data.datasets[0].label = `${exerciseName} (кг)`;
      exerciseChart.options.scales.y.min = minWeight;
      exerciseChart.options.scales.y.max = maxWeight;
      exerciseChart.update();
    } else {
      if (window.myChart) window.myChart.destroy();
      exerciseChart = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: [{
          label: `${exerciseName} (кг)`,
          data: weights,
          borderWidth: 2,
          borderColor: '#ff2d55',
          backgroundColor: 'rgba(255, 45, 85, 0.1)',
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#ff2d55',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]},
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top', labels: { color: '#ffffff', font: { size: 14, weight: 'bold' } } },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              callbacks: {
                label: context => `${exerciseName}: ${context.parsed.y.toFixed(1)} кг`,
                title: tooltipItems => `Дата: ${tooltipItems[0].label}`
              }
            }
          },
          scales: {
            x: {
              title: { display: true, text: 'Дата выполнения', color: '#ffffff', font: { size: 14, weight: 'bold' } },
              ticks: { color: '#ffffff' }
            },
            y: {
              beginAtZero: false,
              title: { display: true, text: 'Вес (кг)', color: '#ffffff', font: { size: 14, weight: 'bold' } },
              ticks: { color: '#ffffff' },
              min: minWeight,
              max: maxWeight
            }
          },
          interaction: { intersect: false, mode: 'nearest' }
        }
      });
      window.myChart = exerciseChart;
    }
  } catch (error) {}
}

async function initExerciseChart() {
  const exerciseSelect = document.getElementById('exercise-select');
  const periodSelect = document.getElementById('period-select');
  
  try {
    const response = await authFetch('/profileMain/unique-exercises');
    if (response.ok) {
      const data = await response.json();
      exerciseSelect.innerHTML = '<option value="">Выберите упражнение</option>';
      if (data.exercises && data.exercises.length > 0) {
        data.exercises.forEach(exercise => {
          const option = document.createElement('option');
          option.value = exercise;
          option.textContent = exercise;
          exerciseSelect.appendChild(option);
        });
        if (exerciseSelect.options.length > 1) {
          exerciseSelect.value = exerciseSelect.options[1].value;
          await createOrUpdateExerciseChart(exerciseSelect.value, periodSelect.value);
        }
      } else {
        const fallbackOptions = document.querySelectorAll('#exercise-select option');
        if (fallbackOptions.length > 1) {
          exerciseSelect.value = fallbackOptions[1].value;
          await createOrUpdateExerciseChart(exerciseSelect.value, periodSelect.value);
        }
      }
    }
  } catch (error) {}
  
  exerciseSelect.addEventListener('change', async function() {
    const exerciseName = this.value;
    const period = periodSelect.value;
    if (exerciseName) await createOrUpdateExerciseChart(exerciseName, period);
  });
  
  periodSelect.addEventListener('change', async function() {
    const exerciseName = exerciseSelect.value;
    const period = this.value;
    if (exerciseName) await createOrUpdateExerciseChart(exerciseName, period);
  });
}

// ========== ФУНКЦИИ ДЛЯ РЕДАКТИРОВАНИЯ ДАННЫХ ==========
async function editWeight(weightValue) {
  try {
    if (!weightValue) weightValue = weightData.userWeight;
    if (isNaN(weightValue) || weightValue <= 0) {
      showNotification('Введите корректный вес', 'error');
      return;
    }
    
    const weightDataToSend = { userWeight: parseFloat(weightValue.toFixed(1)) };
    const response = await authFetch(`/profileMain/edit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(weightDataToSend),
    });
    
    if (response.ok) {
      const responseData = await response.json();
      if (responseData.profileWeightList) weightData = { ...weightData, ...responseData.profileWeightList };
      if (responseData.weightHistory) weightData.weightHistory = responseData.weightHistory;
      updateWeightDisplay();
      updateScale();
      if (weightProgressChart) await createOrUpdateWeightChart(selectElementForWeightChart.value);
      showNotification('Вес успешно сохранен!', 'success');
    } else {
      const errorData = await response.json();
      showNotification(`Ошибка: ${errorData.error || 'Не удалось сохранить вес'}`, 'error');
    }
  } catch (error) {
    showNotification('Ошибка сети. Проверьте подключение.', 'error');
  }
}

async function editGoalWeight() {
  try {
    const goalWeightInput = document.getElementById("targetWeight");
    const goalweightValue = parseFloat(goalWeightInput.value);
    if (isNaN(goalweightValue) || goalweightValue <= 0) {
      showNotification('Введите корректный целевой вес', 'error');
      return;
    }

    const weightDataToSend = { userGoalWeight: goalweightValue };
    const response = await authFetch(`/profileMain/goalWeight/edit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(weightDataToSend),
    });
    
    if (response.ok) {
      const responseData = await response.json();
      if (responseData.profileWeightList) {
        weightData.userGoalWeight = responseData.profileWeightList.userGoalWeight;
        weightData.userWeightToGoal = weightData.userWeight - weightData.userGoalWeight;
        updateWeightDisplay();
        updateScale();
        if (weightProgressChart) await createOrUpdateWeightChart(selectElementForWeightChart.value);
      }
      
      const settingsModal = document.getElementById("settingsModal");
      if (settingsModal) {
        settingsModal.classList.remove("active");
        setTimeout(() => {
          settingsModal.classList.remove("show");
          document.body.style.overflow = "";
        }, 300);
      }
      showNotification('Целевой вес успешно обновлен!', 'success');
    } else {
      const errorData = await response.json();
      showNotification(`Ошибка: ${errorData.error || 'Не удалось обновить цель'}`, 'error');
    }
  } catch (error) {
    showNotification('Ошибка сети. Проверьте подключение.', 'error');
  }
}
async function editStartWeight() {
  try {
    const startWeightInput = document.getElementById("startWeight"); 
    const startweightValue = parseFloat(startWeightInput.value);
    if (isNaN(startweightValue) || startweightValue <= 0) {
      showNotification('Введите корректный стартовый вес', 'error');
      return;
    }

    const weightDataToSend = { userStartWeight: startweightValue };
    const response = await authFetch(`/profileMain/startWeight/edit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(weightDataToSend),
    });
    
    if (response.ok) {
      const responseData = await response.json();
      if (responseData.profileWeightList) {
        weightData.userStartWeight = responseData.profileWeightList.userStartWeight;
        weightData.userWeightChange = weightData.userWeight - weightData.userStartWeight; 
        updateWeightDisplay();
        updateScale();
        if (weightProgressChart) await createOrUpdateWeightChart(selectElementForWeightChart.value);
      }
      
      const settingsModal = document.getElementById("settingsModal");
      if (settingsModal) {
        settingsModal.classList.remove("active");
        setTimeout(() => {
          settingsModal.classList.remove("show");
          document.body.style.overflow = "";
        }, 300);
      }
      showNotification('Стартовый вес успешно обновлен!', 'success');
    } else {
      const errorData = await response.json();
      showNotification(`Ошибка: ${errorData.error || 'Не удалось обновить вес'}`, 'error');
    }
  } catch (error) {
    showNotification('Ошибка сети. Проверьте подключение.', 'error');
  }
}


async function editUserName() {
  try {
    const userNameInput = document.getElementById("userName");
    const userNameValue = userNameInput ? userNameInput.value.trim() : "";
    if (!userNameValue || userNameValue.length < 2) {
      showNotification('Имя должно содержать минимум 2 символа', 'error');
      return;
    }

    const userNameData = { userName: userNameValue };
    const response = await authFetch(`/profileMain/userName/edit`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userNameData),
    });
    
    if (response.ok) {
      const responseData = await response.json();
      weightData.userName = responseData.profileWeightList?.userName || userNameValue;
      updateWeightDisplay();
      showNotification('Имя успешно обновлено!', 'success');
    } else {
      const errorData = await response.json();
      showNotification(`Ошибка: ${errorData.error || 'Не удалось обновить имя'}`, 'error');
    }
  } catch (error) {
    showNotification('Ошибка сети. Проверьте подключение.', 'error');
  }
}

// ========== ФУНКЦИИ ДЛЯ УВЕДОМЛЕНИЙ ==========
function showNotification(message, type = 'info') {
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => notification.remove());

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'info' ? '#2196F3' : '#333'};
    color: white;
    border-radius: 4px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease;
    font-family: Arial, sans-serif;
    font-size: 14px;
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ========== ФУНКЦИИ ДЛЯ МОДАЛЬНЫХ ОКОН ==========
// ========== ФУНКЦИИ ДЛЯ МОДАЛЬНЫХ ОКОН ==========
function initializeSettingsModal() {
  const settingsBtn = document.querySelector(".settings-btn");
  const settingsModal = document.getElementById("settingsModal");
  const closeModal = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelSettings");
  const saveBtn = document.getElementById("saveSettings");
  const themeOptions = document.querySelectorAll(".theme-option");
  const userNameInput = document.getElementById("userName");
  const targetWeightInput = document.getElementById("targetWeight");
  const startWeightInput = document.getElementById("startWeight");

  if (!settingsBtn || !settingsModal) return;

  function loadCurrentSettings() {
    if (userNameInput) {
      const userNameElements = [
        document.querySelector('.user-name-display'),
        document.querySelector('.username'),
        document.querySelector('.user-name'),
        document.querySelector('.profile-info h3'),
        document.querySelector('.user-info h2'),
        document.querySelector('.profile-header h2'),
        document.getElementById('userNameDisplay')
      ];
      for (const element of userNameElements) {
        if (element && element.textContent && element.textContent.trim() !== '') {
          userNameInput.value = element.textContent.trim();
          break;
        }
      }
    }
    if (targetWeightInput) targetWeightInput.value = weightData.userGoalWeight.toFixed(1);
    if (startWeightInput) startWeightInput.value = weightData.userStartWeight.toFixed(1); 
    if (themeOptions.length > 0) {
      themeOptions.forEach(opt => opt.classList.remove("active"));
      themeOptions[0].classList.add("active");
    }
  }

  function closeSettingsModal() {
    settingsModal.classList.remove("active");
    setTimeout(() => {
      settingsModal.classList.remove("show");
      document.body.style.overflow = "";
    }, 300);
  }

  // Обработчик открытия модального окна
  settingsBtn.addEventListener("click", function () {
    loadCurrentSettings();
    settingsModal.classList.add("show");
    setTimeout(() => settingsModal.classList.add("active"), 10);
    document.body.style.overflow = "hidden";
  });

  // Обработчики закрытия модального окна
  if (closeModal) closeModal.addEventListener("click", closeSettingsModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeSettingsModal);
  
  // Закрытие при клике на фон
  settingsModal.addEventListener("click", e => { 
    if (e.target === settingsModal) closeSettingsModal(); 
  });
  
  // Закрытие при нажатии Escape
  document.addEventListener("keydown", e => { 
    if (e.key === "Escape" && settingsModal.classList.contains("show")) closeSettingsModal(); 
  });

  // Обработчики выбора темы
  themeOptions.forEach(option => {
    option.addEventListener("click", function () {
      themeOptions.forEach(opt => opt.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Обработчик сохранения настроек
  if (saveBtn) {
    saveBtn.addEventListener("click", async function () {
      const userName = userNameInput ? userNameInput.value.trim() : "";
      const targetWeight = targetWeightInput ? parseFloat(targetWeightInput.value) : weightData.userGoalWeight;
      const startWeight = startWeightInput ? parseFloat(startWeightInput.value) : weightData.userStartWeight;
      let changesMade = false;

      if (userName && userName !== "Пользователь" && userName !== weightData.userName) {
        await editUserName();
        changesMade = true;
      }

      if (!isNaN(targetWeight) && targetWeight > 0 && targetWeight !== weightData.userGoalWeight) {
        await editGoalWeight();
        changesMade = true;
      }

      if (!isNaN(startWeight) && startWeight > 0 && startWeight !== weightData.userStartWeight) {
        await editStartWeight();
        changesMade = true;
      }

      if (!changesMade) showNotification('Нет изменений для сохранения', 'info');
      closeSettingsModal();
    });
  }
}

function initializeWeightModal() {
  const weightModal = document.getElementById("weightModal");
  const currentWeightDisplay = document.getElementById("current-weight");
  const closeWeightModalBtn = document.getElementById("closeWeightModal");
  const cancelWeightBtn = document.getElementById("cancelWeightChange");
  const saveWeightBtn = document.getElementById("saveWeightChange");
  const weightInput = document.getElementById("weightInput");

  if (!weightModal || !currentWeightDisplay) return;

  function openWeightModal() {
    const currentWeightText = currentWeightDisplay.textContent;
    const currentWeightValue = parseFloat(currentWeightText.replace(" кг", ""));
    if (!isNaN(currentWeightValue) && weightInput) weightInput.value = currentWeightValue.toFixed(1);
    else if (weightInput) weightInput.value = "";
    
    setTimeout(() => { if (weightInput) { weightInput.focus(); weightInput.select(); } }, 300);
    weightModal.classList.add("show");
    setTimeout(() => weightModal.classList.add("active"), 10);
    document.body.style.overflow = "hidden";
  }

  function closeWeightModal() {
    weightModal.classList.remove("active");
    setTimeout(() => {
      weightModal.classList.remove("show");
      document.body.style.overflow = "";
    }, 300);
  }

  function saveWeight() {
    if (!weightInput) return;
    const newWeight = parseFloat(weightInput.value);
    if (!isNaN(newWeight) && newWeight > 0) {
      currentWeightDisplay.textContent = `${newWeight.toFixed(1)} кг`;
      weightData.userWeight = newWeight;
      weightData.userWeightChange = newWeight - weightData.userStartWeight;
      weightData.userWeightToGoal = newWeight - weightData.userGoalWeight;
      updateWeightDisplay();
      updateScale();
      closeWeightModal();
      editWeight(newWeight);
    } else {
      showNotification('Введите корректный вес', 'error');
      weightInput.style.borderColor = "#ff2d55";
      weightInput.style.boxShadow = "0 0 0 3px rgba(255, 45, 85, 0.3)";
      setTimeout(() => {
        weightInput.style.borderColor = "";
        weightInput.style.boxShadow = "";
      }, 2000);
    }
  }

  if (currentWeightDisplay) {
    currentWeightDisplay.style.cursor = "pointer";
    currentWeightDisplay.addEventListener("click", openWeightModal);
  }
  if (closeWeightModalBtn) closeWeightModalBtn.addEventListener("click", closeWeightModal);
  if (cancelWeightBtn) cancelWeightBtn.addEventListener("click", closeWeightModal);
  if (saveWeightBtn) saveWeightBtn.addEventListener("click", saveWeight);
  weightModal.addEventListener("click", event => { if (event.target === weightModal) closeWeightModal(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && weightModal.classList.contains("show")) closeWeightModal(); });
  if (weightInput) weightInput.addEventListener("keydown", event => { if (event.key === "Enter") saveWeight(); });
}

// ========== ФУНКЦИИ ДЛЯ ТЕМ ==========
function applyTheme(themeName) {
  bodyProf.classList.remove('pink-theme', 'black-theme');
  bodyProf.classList.add(themeName + '-theme');
  localStorage.setItem('themeMode', themeName);
  setTimeout(() => updateChartColorsForTheme(), 100);
}

function updateChartColorsForTheme() {
  const isPinkTheme = document.body.classList.contains('pink-theme');
  
  if (weightProgressChart) {
    const borderColor = isPinkTheme ? '#e18bcf' : '#ff2d55';
    const backgroundColor = isPinkTheme ? 'rgba(225, 139, 207, 0.1)' : 'rgba(255, 45, 85, 0.1)';
    const textColor = isPinkTheme ? '#333333' : '#ffffff';
    const gridColor = isPinkTheme ? 'rgba(225, 139, 207, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    
    weightProgressChart.data.datasets[0].borderColor = borderColor;
    weightProgressChart.data.datasets[0].backgroundColor = backgroundColor;
    weightProgressChart.data.datasets[0].pointBackgroundColor = borderColor;
    weightProgressChart.options.plugins.legend.labels.color = textColor;
    weightProgressChart.options.scales.x.ticks.color = textColor;
    weightProgressChart.options.scales.y.ticks.color = textColor;
    weightProgressChart.options.scales.x.grid.color = gridColor;
    weightProgressChart.options.scales.y.grid.color = gridColor;
    weightProgressChart.options.plugins.tooltip.backgroundColor = isPinkTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.8)';
    weightProgressChart.options.plugins.tooltip.titleColor = textColor;
    weightProgressChart.options.plugins.tooltip.bodyColor = textColor;
    weightProgressChart.options.plugins.tooltip.borderColor = borderColor;
    weightProgressChart.update('none');
  }
  
  if (exerciseChart) {
    const borderColor = isPinkTheme ? '#e18bcf' : '#ff2d55';
    const backgroundColor = isPinkTheme ? 'rgba(225, 139, 207, 0.1)' : 'rgba(255, 45, 85, 0.1)';
    const textColor = isPinkTheme ? '#333333' : '#ffffff';
    const gridColor = isPinkTheme ? 'rgba(225, 139, 207, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    exerciseChart.data.datasets[0].borderColor = borderColor;
    exerciseChart.data.datasets[0].backgroundColor = backgroundColor;
    exerciseChart.data.datasets[0].pointBackgroundColor = borderColor;
    exerciseChart.options.plugins.legend.labels.color = textColor;
    exerciseChart.options.scales.x.ticks.color = textColor;
    exerciseChart.options.scales.y.ticks.color = textColor;
    exerciseChart.options.scales.x.grid.color = gridColor;
    exerciseChart.options.scales.y.grid.color = gridColor;
    exerciseChart.options.plugins.tooltip.backgroundColor = isPinkTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.8)';
    exerciseChart.options.plugins.tooltip.titleColor = textColor;
    exerciseChart.options.plugins.tooltip.bodyColor = textColor;
    exerciseChart.options.plugins.tooltip.borderColor = borderColor;
    exerciseChart.update('none');
  }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener("DOMContentLoaded", async function() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
    .chart-error { display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-style: italic; padding: 20px; }
    .chart-container { position: relative; height: 300px; width: 100%; }
  `;
  document.head.appendChild(style);
  
  const savedTheme = localStorage.getItem('themeMode') || 'black';
  applyTheme(savedTheme);
  
  await initWeightScale();    
  await initExerciseChart(); 
  
  initializeSettingsModal();
  initializeWeightModal();
  
  themeButtons.pink.addEventListener('click', () => applyTheme('pink'));
  themeButtons.black.addEventListener('click', () => applyTheme('black'));
});