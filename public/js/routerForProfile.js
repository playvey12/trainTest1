function openSettings() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    

    modal.style.display = 'flex';
    
   
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });

    document.body.style.overflow = 'hidden'; 
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    modal.classList.remove('active');

    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }, 400);
}

window.onclick = function(event) {
    const modal = document.getElementById('settingsModal');
    if (event.target == modal) closeSettings();
}

function openPrivacy() {
    const modal = document.getElementById('privacyModal');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
}

function closePrivacy() {
    const modal = document.getElementById('privacyModal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);
}
function openHelp() {
    const modal = document.getElementById('helpModal');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
}

function closeHelp() {
    const modal = document.getElementById('helpModal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }, 300);
}
function openSetTheme() {
    const modal = document.getElementById('themeModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeTheme() {
    const modal = document.getElementById('themeModal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
}
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
function copyEmail() {
    const email = "support@planlift.ru";
    navigator.clipboard.writeText(email).then(() => {
        showNotification("Почта скопирована","success"); 
    });
}