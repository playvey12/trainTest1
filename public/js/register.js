
// ========== УВЕДОМЛЕНИЯ ==========
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

// ========== СМЕНА ТЕМЫ ==========
const bodyProf = document.querySelector('body');
let savedTheme= localStorage.getItem('themeMode')
if (savedTheme){
    bodyProf.classList.remove( 'pink-theme', 'black-theme');
    bodyProf.classList.add(savedTheme + '-theme');
} else {
       
        const defaultTheme = 'black'; 
        body.classList.add(defaultTheme + '-theme');
        localStorage.setItem('themeMode', defaultTheme);
    }

// Функция для переключения видимости пароля
        function togglePasswordVisibility() {
            const passwordInput = document.getElementById('password');
            const repeatPasswordInput = document.getElementById('confirmPassword');

            const toggleButton = document.getElementById('togglePassword');
            if (repeatPasswordInput.type === 'password') {
                repeatPasswordInput.type = 'text';
                toggleButton.textContent = '🔒'
            } else {
                repeatPasswordInput.type = 'password';
                toggleButton.textContent = '👁'; 
            }
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleButton.textContent = '🔒'; 
            } else {
                passwordInput.type = 'password';
                toggleButton.textContent = '👁'; 
            }
        }
           // Добавляем обработчик события после загрузки страницы
        document.addEventListener('DOMContentLoaded', function() {
            const toggleButton = document.getElementById('togglePassword');
            if (toggleButton) {
                toggleButton.addEventListener('click', togglePasswordVisibility);
            }
        });

// ========== отправка данных пользователя на сервер(почта и пароль) ==========
 const getToken = () => localStorage.getItem("token");
 const setToken = (t) => localStorage.setItem("token", t);
 const clearToken = () => localStorage.removeItem("token");
 async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
  let data;
  try {
    data = await res.json();
  } catch {
    data = { status: res.status };
  }
  if (!res.ok) throw { status: res.status, data };
  return data;
}



async function registerUser(event) {
      if (event) event.preventDefault();
  try {
    const userEmailInput = document.getElementById("email");
    const userPasswordInput = document.getElementById("password");
    const userRepeatPasswordInput = document.getElementById("confirmPassword");

    const userRepeatPasswordValue = userRepeatPasswordInput.value ;
    const userPasswordValue = userPasswordInput.value ;

    const userEmailValue = userEmailInput ? userEmailInput.value.trim() : "";

     if (userRepeatPasswordValue !== userPasswordValue) {
      showNotification("Пароли не совпадают!", "error");
      return;
    }
    if (!userEmailValue || !userPasswordValue) {
      showNotification("Заполните все поля", "error");
      return;
    }

    const userData = { userPassword: userPasswordValue,
        userEmail:userEmailValue
     };
    const response = await fetch(`/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    
  if (response.ok) {
      showNotification("Регистрация успешна!", "success");
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }  else {
      const errorData = await response.json();
        showNotification(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`, "error");
    }
  } catch (error) {
    showNotification('Ошибка сети', 'error');
  }
    return false;
}



async function loginUser(event) {
  if (event) event.preventDefault();
  
  try {
    const userEmailInput = document.getElementById("email");
    const userPasswordInput = document.getElementById("password");
    const userPasswordValue = userPasswordInput.value;
    const userEmailValue = userEmailInput ? userEmailInput.value.trim() : "";
    
    if (!userEmailValue || !userPasswordValue) {
      showNotification("Заполните все поля", "error");
      return false;
    }
    
    const userData = { 
      userPassword: userPasswordValue,
      userEmail: userEmailValue
    };
    
    const response = await fetch(`/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.token) {
     
        localStorage.setItem('token', result.token);
        showNotification("Вход выполнен!", "success");
        setTimeout(() => {
        
          window.location.href = `/profileMain?token=${result.token}`;
        }, 1000);
      }
    }
  } catch (error) {
    showNotification('Ошибка сети', 'error');
  }
  return false;
}
