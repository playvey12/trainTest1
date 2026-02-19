// Универсальная функция навигации
// Универсальная функция навигации
function navigateTo(path) {
  // Функция для чтения куки (аналогичная той, что у тебя в auth.js)
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const token = getCookie('token') || localStorage.getItem('token');
  
  if (token) {
    // Делаем чистый переход без передачи токена в URL. 
    // Браузер сам прикрепит куку к запросу!
    window.location.href = `/${path}`; 
  } else {
    window.location.href = "/login";
  }
}

// Старые функции оставляем для совместимости
function resetUrl() { navigateTo('trainingPlan'); }
function resetUrl1() { navigateTo('trainMode'); }
function resetUrl2() { navigateTo('profileMain'); }

// getTokenFromUrl больше не нужна, если мы отказываемся от токенов в URL, 
// но можешь оставить, если она используется где-то еще для старых ссылок.







document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.classList.remove('active');

        const onClickAttr = item.getAttribute('onclick') || "";
        
        // Массив всех возможных страниц
        const pages = ['trainMode', 'progressMain', 'trainingPlan', 'profileMain'];

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
    
    // Проверяем двойной тап (быстрее 300мс)
    if (now - lastTouchEnd <= 300) {
      // ПРОВЕРКА: Если событие можно отменить и это НЕ скролл
      if (event.cancelable) {
        event.preventDefault();
      }
    }
    lastTouchEnd = now;
  }, { passive: false }); // Важно: false, чтобы preventDefault сработал
  
  // Анимация кнопок (оставляем как есть, тут все ок)
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