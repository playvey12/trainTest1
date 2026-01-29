Русский (Russian)
 Описание проекта
 Ключевые возможности:
• Умный трекинг тренировок: Интуитивно понятный интерфейс для записи подходов, весов и повторений в реальном времени.
• Динамическая аналитика: Визуализация прогресса с помощью интерактивных графиков, построенных на данных из SQL.
• Безопасная аутентификация: Система регистрации и входа на базе JWT (JSON Web Tokens) и хеширования паролей через bcrypt.js.
• Email-интеграция: Подтверждение регистрации и система восстановления пароля через SMTP.
• Telegram Notifications: Интегрированный бот для мгновенного уведомления администратора о новых пользователях.
• Адаптивный дизайн: Полная поддержка мобильных устройств для комфортной работы прямо в тренажерном зале.
🛠 Технологический стек:
• Backend: Node.js, Express.js
• Frontend: Handlebars (HBS), CSS3 (Custom Styles), JavaScript
• Database: SQL (PostgreSQL/MySQL)
• Security: JWT, Bcrypt.js, API Validation
• DevOps: Docker (в процессе), Git

🛠 Требования
Перед запуском убедитесь, что у вас установлены:
• Docker Desktop
• Docker Compose (обычно идет в комплекте с Docker Desktop)
Важно: Убедитесь, что приложение Docker Desktop запущено перед вводом команд в терминале.

📦 Быстрый старт
Настройка окружения: Переименуйте файл .env.example в .env и заполните ваши данные:

•TELEGRAM_BOT_TOKEN — ваш токен от BotFather.
•PORT=3333 — порт приложения.
•Другие ключи (Email, API секреты).

Запуск через Docker: Откройте терминал в папке проекта и выполните:
1.Bash
2.docker compose up -d --build

Готово! Проект доступен по адресу: http://localhost:80 (внешний порт 80 перенаправляет на внутренний 3333).

📋 Полезные команды
•docker compose logs -f — просмотр логов сервера в реальном времени.
•docker compose stop — временная остановка проекта.
•docker compose down — полное удаление контейнеров (данные в data/bin сохранятся).

❓ Устранение неполадок
Ошибка "docker not found": Установите и запустите Docker Desktop.

Данные не сохраняются: Проверьте, что в папке проекта есть директория data/bin, и у вас есть права на запись в неё.




English
   Project Description
Key Features:
• Smart Workout Tracking: Intuitive interface for recording sets, weights, and repetitions in real time.
• Dynamic Analytics: Visualization of progress using interactive graphs built on data from SQL.
• Secure Authentication: Registration and login system based on JWT (JSON Web Tokens) and password hashing via bcrypt.js.
• Email Integration: Registration confirmation and password recovery system via SMTP.
• Telegram Notifications: Integrated bot for instant notification of new users to the administrator.
• Responsive Design: Full support for mobile devices for comfortable use right in the gym.
   🛠 Technology Stack:
• Backend: Node.js, Express.js
• Frontend: Handlebars (HBS), CSS3 (Custom Styles), JavaScript
• Database: SQL (PostgreSQL/MySQL)
• Security: JWT, Bcrypt.js, API Validation
• DevOps: Docker (in progress), Git

   🛠 Requirements
Before running, make sure you have the following installed:
• Docker Desktop
• Docker Compose (usually included with Docker Desktop)
Important: Make sure the Docker Desktop application is running before entering commands in the terminal.

   📦 Quick Start
Environment Setup: Rename the .env.example file to .env and fill in your data:

• TELEGRAM_BOT_TOKEN — your token from BotFather.
• PORT=3333 — application port.
• Other keys (Email, API secrets).

Running via Docker: Open a terminal in the project folder and execute:
1. Bash
2. docker compose up -d --build

Done! The project is available at: http://localhosпшеt:80 (external port 80 redirects to internal 3333).

   📋 Useful Commands
• docker compose logs -f — view server logs in real time. • docker compose stop — temporarily stops the project.
• docker compose down — completely removes the containers (data in data/bin will be preserved).

   ❓ Troubleshooting
Error "docker not found": Install and run Docker Desktop.

Data is not being saved: Check that the project folder contains the data/bin directory and that you have write permissions to it.