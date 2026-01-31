class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'dark';
    this.init();
  }

  init() {
    // Устанавливаем начальную тему
    this.setTheme(this.currentTheme);
    
    // Обработчик для переключателей темы
    document.querySelectorAll('[onclick*="setTheme"]').forEach(button => {
      button.onclick = (e) => {
        const theme = e.currentTarget.getAttribute('onclick').match(/'([^']+)'/)[1];
        this.setTheme(theme);
        this.updateThemeModal(theme);
      };
    });
  }

  setTheme(theme) {
    // Удаляем предыдущие классы тем
    document.body.classList.remove('light-theme', 'dark-theme');
    
    // Добавляем новую тему
    document.body.classList.add(`${theme}-theme`);
    this.currentTheme = theme;
    
    // Сохраняем в localStorage
    localStorage.setItem('theme', theme);
    
    // Сохраняем в куки (для SSR)
    document.cookie = `theme=${theme}; path=/; max-age=31536000`;
    
    // Обновляем иконку в модальном окне
    this.updateThemeModal(theme);
    
    // Генерируем событие для других скриптов
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  }

  updateThemeModal(theme) {
    // Обновляем активное состояние в модальном окне темы
    document.querySelectorAll('.theme-card').forEach(card => {
      card.classList.remove('active');
      
      const themeFromCard = card.getAttribute('onclick').match(/'([^']+)'/)[1];
      if (themeFromCard === theme) {
        card.classList.add('active');
      }
    });
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  // Метод для применения темы к динамически созданным элементам
  applyThemeToElement(element) {
    element.classList.add(`${this.currentTheme}-theme`);
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
  
  // Функции для глобального использования
  window.setTheme = (theme) => {
    window.themeManager.setTheme(theme);
  };
  
  window.toggleTheme = () => {
    window.themeManager.toggleTheme();
  };
});