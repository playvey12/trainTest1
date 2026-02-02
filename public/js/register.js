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
let savedTheme = localStorage.getItem('themeMode');
if (savedTheme){
    bodyProf.classList.remove('pink-theme', 'black-theme');
    bodyProf.classList.add(savedTheme + '-theme');
} else {
    const defaultTheme = 'black'; 
    bodyProf.classList.add(defaultTheme + '-theme');
    localStorage.setItem('themeMode', defaultTheme);
}



// ========== ВАЛИДАЦИЯ ФОРМЫ ==========
function validateForm() {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const privacyCheckbox = document.getElementById("privacyAgreement");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const confirmPasswordError = document.getElementById("confirmPasswordError");
    
    let isValid = true;
    
    // Сбрасываем ошибки
    [emailError, passwordError, confirmPasswordError].forEach(error => {
        if (error) error.style.display = 'none';
    });
    
    // Валидация email
    if (emailInput) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
            if (emailError) emailError.style.display = 'block';
            emailInput.classList.add('error');
            isValid = false;
        } else {
            emailInput.classList.remove('error');
        }
    }
    
    // Валидация пароля
    if (passwordInput) {
        if (passwordInput.value.length < 8) {
            if (passwordError) passwordError.style.display = 'block';
            passwordInput.classList.add('error');
            isValid = false;
        } else {
            passwordInput.classList.remove('error');
        }
    }
    
    // Валидация подтверждения пароля
    if (confirmPasswordInput && passwordInput) {
        if (confirmPasswordInput.value !== passwordInput.value) {
            if (confirmPasswordError) confirmPasswordError.style.display = 'block';
            confirmPasswordInput.classList.add('error');
            isValid = false;
        } else {
            confirmPasswordInput.classList.remove('error');
        }
    }
    
    // Валидация чекбокса
    if (privacyCheckbox && !privacyCheckbox.checked) {
        showNotification("Вы должны согласиться с политикой конфиденциальности", "error");
        privacyCheckbox.focus();
        const privacyCheckboxContainer = document.getElementById('privacyCheckbox');
        if (privacyCheckboxContainer) {
            privacyCheckboxContainer.style.animation = "shake 0.5s ease-in-out";
            privacyCheckboxContainer.classList.add('error');
            setTimeout(() => {
                privacyCheckboxContainer.style.animation = "";
            }, 500);
        }
        isValid = false;
    } else {
        const privacyCheckboxContainer = document.getElementById('privacyCheckbox');
        if (privacyCheckboxContainer) {
            privacyCheckboxContainer.classList.remove('error');
        }
    }
    
    return isValid;
}



// ========== МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ EMAIL ==========
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
        if (!this.modal) return;
        
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
    
   open(email, userData) {
    console.log("Попытка открыть модалку для:", email);

    // 1. Снова ищем элементы
    const modal = document.getElementById('confirmationModal');
    const emailSpan = document.getElementById('userEmail');

    if (!modal) {
        console.error("Критическая ошибка: модалка #confirmationModal не найдена в HTML!");
        return;
    }

    // 2. Вставляем email в текст
    if (emailSpan) {
        emailSpan.textContent = email;
    }

    // --- ВАЖНО: ДОБАВЬТЕ ЭТУ СТРОКУ СЮДА ---
    this.userEmail = email; 
    // ---------------------------------------

    // 3. Сохраняем данные
    this.userData = userData;

    // 4. Открываем
    modal.classList.add('active'); 
    modal.style.display = 'flex';

    // 5. Запуск таймера и очистка
    if (typeof this.startTimer === 'function') this.startTimer();
    if (typeof this.clearInputs === 'function') this.clearInputs();
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
            const response = await fetch('/user/confirm-registration', {
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
            const response = await fetch('/user/resend-confirmation-code', {
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

// ========== МОДАЛЬНЫЕ ОКНА ПОЛИТИКИ И УСЛОВИЙ ==========
class PrivacyPolicyModal {
    constructor() {
        this.privacyModal = document.getElementById('privacyPolicyModal');
        this.termsModal = document.getElementById('termsModal');
        this.closePrivacyBtn = document.getElementById('closePrivacyModal');
        this.closeTermsBtn = document.getElementById('closeTermsModal');
        this.showPrivacyLink = document.getElementById('showPrivacyPolicy');
        this.showTermsLink = document.getElementById('showTermsOfService');
        this.agreePrivacyBtn = document.getElementById('agreePrivacyBtn');
        this.agreeTermsBtn = document.getElementById('agreeTermsBtn');
        this.privacyCheckbox = document.getElementById('privacyAgreement');
        
        this.init();
    }
    
    init() {
        // Обработчики для открытия модальных окон
        if (this.showPrivacyLink) {
            this.showPrivacyLink.addEventListener('click', () => this.openPrivacyModal());
        }
        
        if (this.showTermsLink) {
            this.showTermsLink.addEventListener('click', () => this.openTermsModal());
        }
        
        // Обработчики для закрытия
        if (this.closePrivacyBtn) {
            this.closePrivacyBtn.addEventListener('click', () => this.closePrivacyModal());
        }
        
        if (this.closeTermsBtn) {
            this.closeTermsBtn.addEventListener('click', () => this.closeTermsModal());
        }
        
        // Закрытие по клику вне модального окна
        if (this.privacyModal) {
            this.privacyModal.addEventListener('click', (e) => {
                if (e.target === this.privacyModal) this.closePrivacyModal();
            });
        }
        
        if (this.termsModal) {
            this.termsModal.addEventListener('click', (e) => {
                if (e.target === this.termsModal) this.closeTermsModal();
            });
        }
        
        // Кнопки согласия
        if (this.agreePrivacyBtn) {
            this.agreePrivacyBtn.addEventListener('click', () => {
                this.closePrivacyModal();
                this.markAsRead();
            });
        }
        
        if (this.agreeTermsBtn) {
            this.agreeTermsBtn.addEventListener('click', () => {
                this.closeTermsModal();
                this.markAsRead();
            });
        }
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.privacyModal && this.privacyModal.classList.contains('active')) {
                    this.closePrivacyModal();
                }
                if (this.termsModal && this.termsModal.classList.contains('active')) {
                    this.closeTermsModal();
                }
            }
        });
    }
    
    openPrivacyModal() {
        if (this.privacyModal) {
            this.privacyModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            // Прокручиваем к началу
            const modalContent = this.privacyModal.querySelector('.policy-content');
            if (modalContent) {
                modalContent.scrollTop = 0;
            }
        }
    }
    
    openTermsModal() {
        if (this.termsModal) {
            this.termsModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            // Прокручиваем к началу
            const modalContent = this.termsModal.querySelector('.policy-content');
            if (modalContent) {
                modalContent.scrollTop = 0;
            }
        }
    }
    
    closePrivacyModal() {
        if (this.privacyModal) {
            this.privacyModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
    
    closeTermsModal() {
        if (this.termsModal) {
            this.termsModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
    
    markAsRead() {
        // При закрытии модальных окон можно отслеживать, что пользователь прочитал документы
        // Например, сохранять в localStorage или sessionStorage
        try {
            localStorage.setItem('privacyPolicyRead', 'true');
        } catch (e) {
            console.log('Не удалось сохранить статус прочтения');
        }
    }
}

// ========== РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ ==========
async function registerUser(event) {
    if (event) event.preventDefault();
    
    // Сначала валидируем форму
    if (!validateForm()) {
        return false;
    }
    
    try {
        const userEmailInput = document.getElementById("email");
        const userPasswordInput = document.getElementById("password");
        const userRepeatPasswordInput = document.getElementById("confirmPassword");
        const privacyCheckbox = document.getElementById("privacyAgreement");
        const submitBtn = document.getElementById("submitBtn");
        const btnText = document.getElementById("btnText");
      

        const userRepeatPasswordValue = userRepeatPasswordInput.value;
        const userPasswordValue = userPasswordInput.value;
        const userEmailValue = userEmailInput ? userEmailInput.value.trim() : "";

        // Показываем загрузку
        submitBtn.disabled = true;
        btnText.textContent = "Отправка...";
      

        // Данные для регистрации
        const userData = { 
            userPassword: userPasswordValue,
            userEmail: userEmailValue,
            privacyAccepted: true, // Добавляем флаг согласия
            acceptedAt: new Date().toISOString() // Время принятия
        };

        // Отправляем запров на регистрацию
        const response = await fetch('/user/register', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });
        
        const result = await response.json();
        
        // Сбрасываем состояние кнопки
        submitBtn.disabled = false;
        btnText.textContent = "Создать аккаунт";
     
        
        if (response.ok) {
            showNotification("Код подтверждения отправлен на email", "success");
            
            // Показываем модальное окно для ввода кода
            if (window.confirmationModal) {
                window.confirmationModal.open(userEmailValue, userData);
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
       
        
        if (submitBtn && btnText ) {
            submitBtn.disabled = false;
            btnText.textContent = "Создать аккаунт";
        
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
        
        const response = await fetch(`/user/login`, {
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

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация переключателей паролей
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }
    
    if (toggleConfirmPasswordBtn) {
        toggleConfirmPasswordBtn.addEventListener('click', toggleConfirmPasswordVisibility);
    }
    
    // Валидация при вводе
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const privacyCheckbox = document.getElementById('privacyAgreement');
    
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            const emailError = document.getElementById('emailError');
            if (emailError) emailError.style.display = 'none';
            this.classList.remove('error');
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const passwordError = document.getElementById('passwordError');
            if (passwordError) passwordError.style.display = 'none';
            this.classList.remove('error');
            
            // Синхронная проверка подтверждения пароля
            if (confirmPasswordInput && confirmPasswordInput.value) {
                const confirmPasswordError = document.getElementById('confirmPasswordError');
                if (this.value === confirmPasswordInput.value) {
                    if (confirmPasswordError) confirmPasswordError.style.display = 'none';
                    confirmPasswordInput.classList.remove('error');
                } else {
                    if (confirmPasswordError) confirmPasswordError.style.display = 'block';
                    confirmPasswordInput.classList.add('error');
                }
            }
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const confirmPasswordError = document.getElementById('confirmPasswordError');
            if (passwordInput && passwordInput.value === this.value) {
                if (confirmPasswordError) confirmPasswordError.style.display = 'none';
                this.classList.remove('error');
            } else {
                if (confirmPasswordError) confirmPasswordError.style.display = 'block';
                this.classList.add('error');
            }
        });
    }
    
    if (privacyCheckbox) {
        privacyCheckbox.addEventListener('change', function() {
            const privacyCheckboxContainer = document.getElementById('privacyCheckbox');
            if (this.checked) {
                if (privacyCheckboxContainer) {
                    privacyCheckboxContainer.classList.remove('error');
                }
            }
        });
    }
    
    // Инициализация формы регистрации
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm()) {
                registerUser(e);
            }
        });
        
       
    }
    
    // Инициализация формы входа (если есть на странице)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            loginUser(e);
        });
    }
    
    // Инициализация всех модальных окон
    window.confirmationModal = new ConfirmationModal();
    window.privacyPolicyModal = new PrivacyPolicyModal();
    
    // Добавляем обработчик для кнопки "Я согласен" из модального окна политики
    const agreePrivacyBtn = document.getElementById('agreePrivacyBtn');
    if (agreePrivacyBtn) {
        agreePrivacyBtn.addEventListener('click', function() {
            // Автоматически ставим галочку согласия
            const privacyCheckbox = document.getElementById('privacyAgreement');
            if (privacyCheckbox) {
                privacyCheckbox.checked = true;
                const privacyCheckboxContainer = document.getElementById('privacyCheckbox');
                if (privacyCheckboxContainer) {
                    privacyCheckboxContainer.classList.remove('error');
                }
            }
        });
    }
    
    // Аналогично для условий использования
    const agreeTermsBtn = document.getElementById('agreeTermsBtn');
    if (agreeTermsBtn) {
        agreeTermsBtn.addEventListener('click', function() {
            const privacyCheckbox = document.getElementById('privacyAgreement');
            if (privacyCheckbox) {
                privacyCheckbox.checked = true;
                const privacyCheckboxContainer = document.getElementById('privacyCheckbox');
                if (privacyCheckboxContainer) {
                    privacyCheckboxContainer.classList.remove('error');
                }
            }
        });
    }
});
// Универсальная функция, которая меняет type="password" на "text" и иконку
// ========== ОСТАВИТЬ ЭТОТ БЛОК (Строки 177-184) ==========
function toggleInputVisibility(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    
    if (!input || !button) return; 
    
    const icon = button.querySelector('i');
    if (input.type === "password") {
        input.type = "text";
        // Меняем иконку
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash'); // Убедитесь, что у вас подключен FontAwesome, где есть эта иконка
    } else {
        input.type = "password";
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function togglePasswordVisibility() {
    toggleInputVisibility('password', 'togglePassword');
}

function toggleConfirmPasswordVisibility() {
    toggleInputVisibility('confirmPassword', 'toggleConfirmPassword');
}
// ========== СТИЛИ ДЛЯ АНИМАЦИЙ ==========
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
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Экспортируем функции для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showNotification,
        togglePasswordVisibility,
        toggleConfirmPasswordVisibility,
        validateForm,
       
        ConfirmationModal,
        PrivacyPolicyModal,
        registerUser,
        loginUser
    };
}

// ========== ФУНКЦИИ ПЕРЕКЛЮЧЕНИЯ ВИДИМОСТИ ПАРОЛЯ ==========


// Открыть модалку
document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('resetPasswordModal').classList.add('active');
});

// Закрыть модалку
document.getElementById('closeResetModal')?.addEventListener('click', () => {
    document.getElementById('resetPasswordModal').classList.remove('active');
});

// Шаг 1: Запрос кода
async function requestResetCode() {
    const email = document.getElementById('resetEmail').value;
    if (!email) return showNotification("Введите email", "error");

    try {
        const res = await fetch('/user/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (res.ok) {
            showNotification("Код отправлен!", "success");
            document.getElementById('resetStep1').style.display = 'none';
            document.getElementById('resetStep2').style.display = 'block';
        } else {
            const data = await res.json();
            showNotification(data.error, "error");
        }
    } catch (e) { showNotification("Ошибка сети", "error"); }
}

// Шаг 2: Сброс
async function resetPassword() {
    const email = document.getElementById('resetEmail').value;
    const code = document.getElementById('resetCode').value;
    const newPassword = document.getElementById('newPassword').value;

    if (newPassword.length < 8) return showNotification("Пароль слишком короткий", "error");

    try {
        const res = await fetch('/user/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, newPassword })
        });
        if (res.ok) {
            showNotification("Пароль успешно изменен!", "success");
            setTimeout(() => location.reload(), 1500);
        } else {
            const data = await res.json();
            showNotification(data.error, "error");
        }
    } catch (e) { showNotification("Ошибка сети", "error"); }
}
document.addEventListener('DOMContentLoaded', () => {
    const resetModal = document.getElementById('resetPasswordModal');
    const openBtn = document.getElementById('openResetModal');
    const closeBtn = document.getElementById('closeResetModal');

    if (openBtn && resetModal) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Чтобы страница не прыгала вверх
            resetModal.classList.add('active'); // Добавляем класс из CSS
        });
    }

    if (closeBtn && resetModal) {
        closeBtn.addEventListener('click', () => {
            resetModal.classList.remove('active');
        });
    }

    // Закрытие при клике вне контента модалки
    window.addEventListener('click', (e) => {
        if (e.target === resetModal) {
            resetModal.classList.remove('active');
        }
    });
});