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
let savedTheme = localStorage.getItem('themeMode')
if (savedTheme){
    bodyProf.classList.remove('pink-theme', 'black-theme');
    bodyProf.classList.add(savedTheme + '-theme');
} else {
    const defaultTheme = 'black'; 
    body.classList.add(defaultTheme + '-theme');
    localStorage.setItem('themeMode', defaultTheme);
}

// ========== ФУНКЦИИ ДЛЯ ПАРОЛЕЙ ==========
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const repeatPasswordInput = document.getElementById('confirmPassword');
    const toggleButton = document.getElementById('togglePassword');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.textContent = '🔒';
    } else {
        passwordInput.type = 'password';
        toggleButton.textContent = '👁'; 
    }
}

function toggleConfirmPasswordVisibility() {
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const toggleButton = document.getElementById('toggleConfirmPassword');
    
    if (confirmPasswordInput.type === 'password') {
        confirmPasswordInput.type = 'text';
        toggleButton.textContent = '🔒';
    } else {
        confirmPasswordInput.type = 'password';
        toggleButton.textContent = '👁'; 
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }
    
    if (toggleConfirmPasswordBtn) {
        toggleConfirmPasswordBtn.addEventListener('click', toggleConfirmPasswordVisibility);
    }
});

// ========== API ФУНКЦИИ ==========
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

// ========== МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ ==========
class ConfirmationModal {
    constructor() {
        this.modal = document.getElementById('confirmationModal');
        this.closeBtn = document.getElementById('closeModal');
        this.confirmBtn = document.getElementById('confirmCodeBtn');
        this.resendBtn = document.getElementById('resendCode');
        this.codeInputs = document.querySelectorAll('.code-input');
        this.codeError = document.getElementById('codeError');
        this.userEmailSpan = document.getElementById('userEmail');
        this.timerElement = document.getElementById('timer');
        this.countdownElement = document.getElementById('countdown');
        this.confirmBtnText = document.getElementById('confirmBtnText');
        this.confirmLoader = document.getElementById('confirmLoader');
        
        this.timer = null;
        this.timeLeft = 60;
        this.isResendEnabled = false;
        this.userEmail = '';
        this.registrationData = null;
        
        this.init();
    }
    
    init() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
        
        this.confirmBtn.addEventListener('click', (e) => this.confirmCode(e));
        this.resendBtn.addEventListener('click', (e) => this.resendCode(e));
        
        this.codeInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => this.handleCodeInput(e, index));
            input.addEventListener('keydown', (e) => this.handleCodeNavigation(e, index));
            input.addEventListener('paste', (e) => this.handlePaste(e));
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }
    
    open(email, registrationData) {
        this.userEmail = email;
        this.registrationData = registrationData;
        this.userEmailSpan.textContent = email;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.codeInputs[0].focus();
        this.startTimer();
    }
    
    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        this.resetForm();
        this.stopTimer();
    }
    
    resetForm() {
        this.codeInputs.forEach(input => {
            input.value = '';
            input.classList.remove('error', 'filled', 'success');
            input.disabled = false;
        });
        this.hideError();
        this.confirmBtn.disabled = true;
        this.confirmBtnText.textContent = 'Подтвердить';
        this.confirmLoader.style.display = 'none';
    }
    
    handleCodeInput(e, index) {
        const input = e.target;
        const value = input.value;
        
        if (!/^\d*$/.test(value)) {
            input.value = value.replace(/\D/g, '');
            return;
        }
        
        if (value.length === 1) {
            input.classList.add('filled');
            input.classList.remove('error');
            
            if (index < this.codeInputs.length - 1) {
                this.codeInputs[index + 1].focus();
            }
        } else if (value.length === 0) {
            input.classList.remove('filled');
        }
        
        this.updateConfirmButtonState();
    }
    
    handleCodeNavigation(e, index) {
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
            this.codeInputs[index - 1].focus();
            this.codeInputs[index - 1].value = '';
            this.codeInputs[index - 1].classList.remove('filled');
        } else if (e.key === 'ArrowLeft' && index > 0) {
            this.codeInputs[index - 1].focus();
        } else if (e.key === 'ArrowRight' && index < this.codeInputs.length - 1) {
            this.codeInputs[index + 1].focus();
        }
        
        this.updateConfirmButtonState();
    }
    
    handlePaste(e) {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').slice(0, 6);
        
        if (/^\d{6}$/.test(pasteData)) {
            pasteData.split('').forEach((char, index) => {
                if (this.codeInputs[index]) {
                    this.codeInputs[index].value = char;
                    this.codeInputs[index].classList.add('filled');
                    this.codeInputs[index].classList.remove('error');
                }
            });
            
            if (this.codeInputs[5]) {
                this.codeInputs[5].focus();
            }
        }
        
        this.updateConfirmButtonState();
    }
    
    getCode() {
        return Array.from(this.codeInputs)
            .map(input => input.value)
            .join('');
    }
    
    updateConfirmButtonState() {
        const code = this.getCode();
        this.confirmBtn.disabled = code.length !== 6;
    }
    
    showError(message) {
        this.codeError.textContent = message;
        this.codeError.style.display = 'block';
        this.codeInputs.forEach(input => input.classList.add('error'));
        
        setTimeout(() => {
            this.codeInputs.forEach(input => input.classList.remove('error'));
        }, 500);
    }
    
    hideError() {
        this.codeError.style.display = 'none';
    }
    
    async confirmCode(e) {
    e.preventDefault();
    
    const code = this.getCode();
    if (code.length !== 6) {
        this.showError('Введите 6-значный код');
        return;
    }
    
    this.confirmBtn.disabled = true;
    this.confirmBtnText.textContent = 'Проверка...';
    this.confirmLoader.style.display = 'block';
    this.hideError();
    
    try {
        // Отправляем запрос на подтверждение
        const response = await fetch('/confirm-registration', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userEmail: this.userEmail,
                confirmationCode: code
            }),
        });
        
        const result = await response.json();
        
        if (response.ok) {
            this.showSuccess();
            showNotification("Регистрация успешно завершена!", "success");
            
            // Сохраняем токен
            if (result.token) {
                localStorage.setItem('token', result.token);
            }
            
            setTimeout(() => {
                this.close();
                window.location.href = '/profileMain';
            }, 2000);
            
        } else {
            throw new Error(result.error || 'Ошибка подтверждения');
        }
        
    } catch (error) {
        console.error('Ошибка подтверждения:', error);
        this.showError(error.message || 'Ошибка подтверждения');
        this.confirmBtn.disabled = false;
        this.confirmBtnText.textContent = 'Подтвердить';
        this.confirmLoader.style.display = 'none';
    }
}
    
    showSuccess() {
        this.confirmBtnText.textContent = '✓ Успешно!';
        this.confirmLoader.style.display = 'none';
        this.codeInputs.forEach(input => {
            input.classList.remove('error', 'filled');
            input.classList.add('success');
            input.disabled = true;
        });
    }
    
    async resendCode(e) {
        e.preventDefault();
        
        if (!this.isResendEnabled) return;
        
        const originalText = this.resendBtn.textContent;
        this.resendBtn.textContent = 'Отправка...';
        this.resendBtn.disabled = true;
        
        try {
            // Отправляем запрос на повторную отправку кода
            const response = await fetch('/resend-confirmation-code', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: this.userEmail }),
            });
            
            if (response.ok) {
                showNotification("Код подтверждения отправлен повторно!", "success");
                
                // Сбрасываем таймер
                this.timeLeft = 60;
                this.isResendEnabled = false;
                this.startTimer();
                
            } else {
                throw new Error('Не удалось отправить код');
            }
            
        } catch (error) {
            console.error('Ошибка при повторной отправке:', error);
            showNotification('Не удалось отправить код. Попробуйте позже.', 'error');
        } finally {
            this.resendBtn.textContent = originalText;
            this.resendBtn.disabled = false;
        }
    }
    
    startTimer() {
        this.timeLeft = 60;
        this.isResendEnabled = false;
        this.resendBtn.disabled = true;
        this.timerElement.style.display = 'block';
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.isResendEnabled = true;
                this.resendBtn.disabled = false;
                this.timerElement.style.display = 'none';
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    updateTimerDisplay() {
        this.countdownElement.textContent = this.timeLeft;
    }
}

// Инициализация модального окна при загрузке
let confirmationModal;
document.addEventListener('DOMContentLoaded', function() {
    confirmationModal = new ConfirmationModal();
    window.confirmationModal = confirmationModal;
});

// ========== РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ ==========
async function registerUser(event) {
    if (event) event.preventDefault();
    
    try {
        const userEmailInput = document.getElementById("email");
        const userPasswordInput = document.getElementById("password");
        const userRepeatPasswordInput = document.getElementById("confirmPassword");
        const submitBtn = document.getElementById("submitBtn");
        const btnText = document.getElementById("btnText");
        const loader = document.getElementById("loader");

        const userRepeatPasswordValue = userRepeatPasswordInput.value;
        const userPasswordValue = userPasswordInput.value;
        const userEmailValue = userEmailInput ? userEmailInput.value.trim() : "";

        // Валидация
        if (userRepeatPasswordValue !== userPasswordValue) {
            showNotification("Пароли не совпадают!", "error");
            return false;
        }
        
        if (!userEmailValue || !userPasswordValue) {
            showNotification("Заполните все поля", "error");
            return false;
        }
        
        if (userPasswordValue.length < 8) {
            showNotification("Пароль должен содержать минимум 8 символов", "error");
            return false;
        }
        
        // Проверяем email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmailValue)) {
            showNotification("Введите корректный email", "error");
            return false;
        }

        // Показываем загрузку
        submitBtn.disabled = true;
        btnText.textContent = "Отправка...";
        loader.style.display = "block";

        // Данные для регистрации
        const userData = { 
            userPassword: userPasswordValue,
            userEmail: userEmailValue
        };

        // Отправляем запрос на регистрацию
        const response = await fetch('/register', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });
        
        const result = await response.json();
        
        // Сбрасываем состояние кнопки
        submitBtn.disabled = false;
        btnText.textContent = "Создать аккаунт";
        loader.style.display = "none";
        
        if (response.ok) {
            showNotification("Код подтверждения отправлен на email", "success");
            
            // Показываем модальное окно для ввода кода
            if (confirmationModal) {
                confirmationModal.open(userEmailValue, null); // Передаем только email
            }
        } else {
            showNotification(`Ошибка: ${result.error || 'Неизвестная ошибка'}`, "error");
        }
        
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        showNotification('Ошибка сети', 'error');
        
        // Сбрасываем состояние кнопки в случае ошибки
        const submitBtn = document.getElementById("submitBtn");
        const btnText = document.getElementById("btnText");
        const loader = document.getElementById("loader");
        
        if (submitBtn && btnText && loader) {
            submitBtn.disabled = false;
            btnText.textContent = "Создать аккаунт";
            loader.style.display = "none";
        }
    }
    
    return false;
}

// ========== ВХОД ПОЛЬЗОВАТЕЛЯ ==========
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
        } else {
            const errorData = await response.json();
            showNotification(`Ошибка: ${errorData.error || 'Неверный email или пароль'}`, "error");
        }
    } catch (error) {
        showNotification('Ошибка сети', 'error');
    }
    return false;
}


const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);