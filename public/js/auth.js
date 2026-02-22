// const.js
const API_BASE = '';
const getToken = () => {

    const localToken = localStorage.getItem('token');
    if (localToken) return localToken;


    const name = "token=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return null;
};
const setToken = (token) => localStorage.setItem('token', token);
const clearToken = () => {
    localStorage.removeItem('token');
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};
// fetch.js
async function authFetch(url, options = {}) {

  const token = getToken();
  
  // Создаем объект заголовков
  const headers = { ...options.headers };
  
  // ВАЖНО: Если body это FormData, НЕ СТАВИМ Content-Type. 
  // Браузер сделает это сам.
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers, // используем наши обработанные заголовки
      credentials: 'same-origin'
    });

    if (response.status === 401) {
      clearToken();
      showNotification('Сессия истекла. Пожалуйста, войдите снова.', 'error');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      throw new Error('Unauthorized');
    }
    
    if (response.status === 403) {
      showNotification('Доступ запрещен', 'error');
      throw new Error('Forbidden');
    }
    
    return response;
  } catch (error) {
    if (error.message !== 'Unauthorized' && error.message !== 'Forbidden') {
      showNotification('Ошибка сети. Проверьте подключение.', 'error');
    }
    throw error;
  }
}

// notifications.js
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
    notification.style.animation = 'slideOut 0.7s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}



// theme.js
function initTheme() {
  const bodyProf = document.querySelector('body');
  let savedTheme = localStorage.getItem('themeMode');
  
  if (savedTheme) {
    bodyProf.classList.remove('pink-theme', 'black-theme');
    bodyProf.classList.add(savedTheme + '-theme');
  } else {
    const defaultTheme = 'black';
    bodyProf.classList.add(defaultTheme + '-theme');
    localStorage.setItem('themeMode', defaultTheme);
  }
}

// token-verify.js
async function verifyToken() {
  try {
    const token = getToken();
    if (!token) return false;
    
    const response = await authFetch('/profileMain/verify');
    return response.ok;
  } catch (error) {
    return false;
  }
}
async function checkAuth() {
    const currentPath = window.location.pathname;
    const authPages = ['/login', '/register', '/'];
    const tg = window.Telegram?.WebApp;

    // Если мы внутри Telegram, всегда пробуем обновить сессию по initData
    // Это гарантирует, что даже если сменили аккаунт в приложении TG, 
    // кука обновится под нужного юзера.
    if (tg?.initData) {
        try {
            const response = await fetch('/user/tg-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: tg.initData })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    setToken(data.token);
                    if (authPages.includes(currentPath)) {
                        window.location.replace('/profileMain');
                    }
                    return; // Успешно вошли по актуальным данным TG
                }
            }
        } catch (err) {
            console.error('Ошибка авто-логина:', err);
        }
    }

    // Если мы НЕ в Telegram или авто-логин не сработал, проверяем обычную куку
    let token =  getToken(); 
    if (token) {
        if (authPages.includes(currentPath)) {
            window.location.replace('/profileMain');
        }
    } else {
        const protectedPaths = ['/profileMain', '/trainingPlan', '/trainMode', '/progressMain'];
        if (protectedPaths.some(path => currentPath.startsWith(path))) {
            window.location.replace('/login');
        }
    }
}

// Экспорт функций
window.auth = {
  checkAuth,
  getToken,
  setToken,
  clearToken,
  authFetch,
  showNotification,
  initTheme,
  verifyToken
};

// Добавляем стили для уведомлений
if (!document.querySelector('#notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
      font-family: Arial, sans-serif;
      font-size: 14px;
    }
    .notification.success { background: #4CAF50; color: white; }
    .notification.error { background: #f44336; color: white; }
    .notification.info { background: #2196F3; color: white; }
  `;
  document.head.appendChild(style);
}

if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    checkAuth(); // Принудительный запуск
}