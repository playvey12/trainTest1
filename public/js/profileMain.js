// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И НАСТРОЙКИ ==========
const bodyProf = document.querySelector('body');
let userData = {
    name: "{{user.name}}", // Данные подтянутся из шаблона
    theme: localStorage.getItem('themeMode') || 'dark'
};

// ========== УТИЛИТЫ (УВЕДОМЛЕНИЯ И ВЫХОД) ==========
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Стили оставляем твои, они отличные
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 12px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white; border-radius: 8px; z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3); animation: slideIn 0.3s ease;
        font-family: sans-serif; font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function logout() {
    // Твоя старая логика выхода
    if (typeof clearToken === 'function') clearToken(); 
    showNotification("Успешный выход", "success");
    setTimeout(() => { window.location.href = '/register'; }, 1000);
}

// ========== РАБОТА С ТЕМОЙ (Интеграция со старой логикой) ==========
function applyTheme(themeName) {
    bodyProf.classList.remove('dark-theme', 'light-theme');
    bodyProf.classList.add(themeName + '-theme');
    
    // Если нужно для совместимости со старыми стилями:
    if(themeName === 'dark') bodyProf.setAttribute('data-theme', 'dark');
    else bodyProf.removeAttribute('data-theme');

    localStorage.setItem('themeMode', themeName);
    
    // Обновляем визуальный выбор в модалке
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.remove('active');
        if (card.classList.contains(themeName)) card.classList.add('active');
    });
}

// ========== ФУНКЦИИ ОТКРЫТИЯ МОДАЛОК ==========
function openSettings() { toggleModal('settingsUserProfileModal', true); }
function closeSettings() { toggleModal('settingsUserProfileModal', false); }

function openPrivacy() { toggleModal('privacyModal', true); }
function closePrivacy() { toggleModal('privacyModal', false); }

function openSetTheme() { toggleModal('themeModal', true); }
function closeTheme() { toggleModal('themeModal', false); }

function openHelp() { toggleModal('helpModal', true); }
function closeHelp() { toggleModal('helpModal', false); }

function openData() { toggleModal('aiDataModal', true); }
function closeData() { toggleModal('aiDataModal', false); }


function toggleModal(id, show) {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (show) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        document.body.style.overflow = "hidden";
    } else {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = "";
        }, 300);
    }
}

// ========== ЛОГИКА РЕДАКТИРОВАНИЯ (ТВОЙ СТАРЫЙ АПИ) ==========
async function saveProfileSettings() {
    const nameInput = document.getElementById("editName");
    const newName = nameInput ? nameInput.value.trim() : "";

    const currentName = document.querySelector('.user-name')?.textContent || "";

    if (newName && newName !== currentName) {
        try {
            const response = await authFetch(`/profileMain/userName/edit`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userName: newName }), 
            });

            const result = await response.json();

            if (response.ok) {
                showNotification('Имя успешно обновлено!', 'success');
          
                setTimeout(() => {
                    window.location.reload(); 
                }, 800);
            } else {
                showNotification(result.error || 'Ошибка валидации', 'error');
            }
        } catch (e) {
            console.error("Fetch error:", e);
            showNotification('Ошибка сети.', 'error');
        }
    } else {
        closeSettings();
    }
    const tgUsernameInput=document.getElementById("editTelegram")
    const newTgUsername=tgUsernameInput?tgUsernameInput.value.trim():"";
    const currentTgUsername = document.querySelector('.user.telegram')?.textContent || "";
    if (newTgUsername && newTgUsername !== currentTgUsername) {
        try {
            const response = await authFetch(`/profileMain/tgUserName/edit`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tgUserName: newTgUsername }), 
            });

            const result = await response.json();

            if (response.ok) {
                showNotification('Юзернейм успешно обновлен!', 'success');
          
                setTimeout(() => {
                    window.location.reload(); 
                }, 800);
            } else {
                showNotification(result.error || 'Ошибка валидации', 'error');
            }
        } catch (e) {
            console.error("Fetch error:", e);
            showNotification('Ошибка сети.', 'error');
        }
    } else {
        closeSettings();
    }
 const avatarInput = document.getElementById("modalAvatarInput");
    const avatarFile = avatarInput.files[0]; 

    if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile); 

        try {
            // ИСПРАВЛЕНИЕ ЗДЕСЬ
            const response = await authFetch(`/profileMain/avatar/edit`, {
                method: "PUT", 
                
            
                headers: {
                   
                },
                body: formData 
            });
            
        
            const result = await response.json(); 

            if (response.ok) {
                showNotification('Фото обновлено!', 'success');
                 setTimeout(() => {
                    window.location.reload(); 
                }, 800);
            } else {
                showNotification('Ошибка при загрузке фото', 'error');
            }
        } catch (e) {
            console.error("Avatar upload error:", e);
             showNotification('Ошибка при отправке.', 'error');
        }
    }
}
// ========== НОВЫЕ ФУНКЦИИ (ЗАГЛУШКИ) ==========

function changePassword() {
    showNotification("Функция смены пароля в разработке", "info");
}

function linkTelegram() {
    showNotification("Перенаправление в бот...", "success");
    // window.location.href = "https://t.me/your_bot";
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener("DOMContentLoaded", () => {
    // Применяем сохраненную тему
    const savedTheme = localStorage.getItem('themeMode') || 'dark';
    applyTheme(savedTheme);

    // Закрытие модалок по клику на фон (универсально)
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                const closeFn = modal.id.replace('Modal', '');
                window['close' + closeFn.charAt(0).toUpperCase() + closeFn.slice(1)]?.();
                // Для специфических ID:
                if(modal.id === 'settingsUserProfileModal') closeSettings();
            }
        });
    });
});

// Копируйте это в JS файл, который подключен к profileMain




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

async function savePrivacySettings() {
    const oldPassInput = document.getElementById('oldPassword');
    const newPassInput = document.getElementById('newPassword');
    const confirmPassInput = document.getElementById('confirmPasswordUser');

    if (!oldPassInput || !newPassInput || !confirmPassInput) {
        showNotification("Ошибка: Поля ввода не найдены", "error");
        return;
    }

    const oldPassword = oldPassInput.value;
    const newPassword = newPassInput.value;
    const confirmPassword = confirmPassInput.value;

    // Валидация на фронтенде
    if (!oldPassword) {
        showNotification("Введите текущий пароль", "error");
        oldPassInput.focus();
        return;
    }

    if (newPassword.length < 8) {
        showNotification("Новый пароль должен быть не менее 8 символов", "error");
        return;
    }

    if (newPassword === oldPassword) {
        showNotification("Новый пароль не должен совпадать со старым", "error");
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification("Пароли не совпадают", "error");
        return;
    }

    try {
   
        const result = await apiFetch('/user/change-password', {
            method: 'POST',
            body: JSON.stringify({ 
                oldPassword: oldPassword, 
                newPassword: newPassword 
            })
        });

        showNotification("Пароль успешно изменен", "success");
        

        [oldPassInput, newPassInput, confirmPassInput].forEach(input => input.value = '');

    } catch (err) {
        console.error("Ошибка при смене пароля:", err);
 
        const errorMsg = err.data?.error || "Не удалось изменить пароль";
        showNotification(errorMsg, "error");
    }
}

window.savePrivacySettings = savePrivacySettings;


function confirmDeleteAccount() { 
    toggleModal('deleteConfirmModal', true); 
}

function closeDeleteModal() { 
    toggleModal('deleteConfirmModal', false); 
}

async function executeDeleteAccount() {

    const btn = document.querySelector('.danger-btn');
    btn.disabled = true;
    btn.innerText = 'Удаление...';

    try {
        const response = await window.auth.authFetch('/user/delete-account', {
            method: 'DELETE'
        });

        if (response.ok) {
            window.auth.showNotification('Прощайте! Аккаунт удален.', 'success');
            window.auth.clearToken();
            setTimeout(() => {
                window.location.href = '/register';
            }, 1500);
        } else {
            const data = await response.json();
            window.auth.showNotification(data.error || 'Ошибка удаления', 'error');
            btn.disabled = false;
            btn.innerText = 'Да, удалить';
        }
    } catch (error) {
        console.error('Delete error:', error);
        window.auth.showNotification('Ошибка сети', 'error');
        btn.disabled = false;
        btn.innerText = 'Да, удалить';
    }
}