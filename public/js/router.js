// Универсальная функция навигации
function navigateTo(path) {
  const token = localStorage.getItem('token') || getTokenFromUrl();
  
  if (token) {
    // Сохраняем токен в localStorage на всякий случай, если он пришел только из URL
    if (!localStorage.getItem('token') && getTokenFromUrl()) {
        localStorage.setItem('token', getTokenFromUrl());
    }
    document.location = `./${path}?token=${token}`;
  } else {
    // Если токена нет совсем — только тогда на логин
    document.location = "./login";
  }
}

// Теперь старые функции можно переписать так (для совместимости):
function resetUrl() { navigateTo('trainingPlan'); }
function resetUrl1() { navigateTo('trainMode'); }
function resetUrl2() { navigateTo('profileMain'); }
function getTokenFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
}









document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.classList.remove('active');

        const onClickAttr = item.getAttribute('onclick') || "";
        
        // Массив всех возможных страниц
        const pages = ['trainMode', 'statistics', 'trainingPlan', 'profileMain'];

        pages.forEach(page => {
            // Проверяем: содержит ли onclick имя страницы И есть ли это имя в URL
            if (onClickAttr.includes(page) && currentPath.includes(page)) {
                item.classList.add('active');
            }
        });
        
        // Дополнительная проверка для старых функций (для подстраховки)
        if (onClickAttr.includes('resetUrl1') && currentPath.includes('trainMode')) item.classList.add('active');
        if (onClickAttr.includes('resetUrl2') && currentPath.includes('profileMain')) item.classList.add('active');
        if (onClickAttr.includes('resetUrl') && !onClickAttr.includes('resetUrl1') && currentPath.includes('trainingPlan')) item.classList.add('active');
    });
});

document.addEventListener('DOMContentLoaded', function() {
  
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);


  const weightButtons = document.querySelectorAll('.weight-btn, .nav-item');
  weightButtons.forEach(button => {
    button.addEventListener('touchstart', function() {
      this.style.transform = 'scale(0.95)';
    }, { passive: true });
    
    button.addEventListener('touchend', function() {
      this.style.transform = '';
    }, { passive: true });
  });
});