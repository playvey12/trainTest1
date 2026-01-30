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
}
// ========== НОВЫЕ ФУНКЦИИ (ЗАГЛУШКИ) ==========
function changeAvatar() {
    showNotification("Загрузка фото будет доступна в следующем обновлении", "info");
}

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