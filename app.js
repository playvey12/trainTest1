const express = require("express");
const path = require("path");
const hbs = require("hbs");
const fs = require("fs");
// Подключаем функцию получения данных из БД
const { getUserDataDB } = require("./data/trainData"); 

const { isAuth, requireVerified,setLangMiddleware } = require("./middleware/all.middleware");
const { startCleanupTask } = require("./services/cleanDB");
const favicon = require('serve-favicon');

const profileRouter = require("./routers/profileRouter");
const trainModeRouter = require("./routers/trainModeRouter");
const userRouter = require("./routers/userRouter");
const apiRouter = require("./routers/apiRouter");
const trainPlanRouter = require("./routers/trainPlanRouter");
const progressMainRouter = require("./routers/progressMainRouter");

const port = process.env.PORT || 3333;
const app = express();




hbs.registerHelper('equal', function(a, b) {
    return String(a) === String(b);
});
hbs.registerHelper('getFirstWeight', function(weight) {
    if (!weight) return '0';
    return String(weight).split(',')[0].trim();
});

app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "/views/partials"));

startCleanupTask();

app.use(favicon(path.join(__dirname, 'public', 'img', 'favicon.ico')));
app.use(express.static(path.join(__dirname, "./public")));
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 2. Создаем Middleware для языка (но пока не подключаем глобально)

app.get('/', (req, res) => res.redirect('/register'));
app.get('/register', (req, res) => res.render("register.hbs"));
app.get('/login', (req, res) => res.render("login.hbs"));

app.use("/user", userRouter); // Тут язык обычно не нужен, это технические роуты

// 3. ВАЖНО: Вставляем setLangMiddleware ПОСЛЕ isAuth
// Цепочка такая: Проверка авторизации -> Установка языка -> Роутер страницы
app.use("/api", isAuth, requireVerified, apiRouter);

app.use("/profileMain", isAuth,setLangMiddleware, requireVerified, setLangMiddleware, profileRouter);
app.use("/progressMain", isAuth,setLangMiddleware, requireVerified, setLangMiddleware, progressMainRouter);
app.use("/trainingPlan", isAuth,setLangMiddleware, requireVerified, setLangMiddleware, trainPlanRouter);
app.use("/trainMode", isAuth,setLangMiddleware, requireVerified, setLangMiddleware, trainModeRouter);

app.use((req, res) => res.status(404).render("404.hbs", { layout: false }));

const server = app.listen(port, () => {
  console.log(` Server running: http://localhost:${port}/`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(` Порт ${port} уже занят. Попробуй другой.`);
  } else {
    console.error(' Ошибка сервера:', err);
  }
});