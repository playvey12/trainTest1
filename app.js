const express = require("express");
const path = require("path");
const hbs = require("hbs");
const fs = require("fs");
const { isAuth, requireVerified } = require("./middleware/all.middleware");
const { startCleanupTask } = require("./services/cleanDB");
const favicon = require('serve-favicon');

const profileRouter = require("./routers/profileRouter");
const trainModeRouter = require("./routers/trainModeRouter");
const userRouter = require("./routers/userRouter");
const trainPlanRouter = require("./routers/trainPlanRouter");

const port = process.env.PORT || 3333;
const app = express();

const translations = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "languages", "ru.json"), "utf8")
);
app.locals.t = translations;
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "/views/partials"));

startCleanupTask();

app.use(favicon(path.join(__dirname, 'public', 'img', 'favicon.ico')));
app.use(express.static(path.join(__dirname, "./public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.redirect('/register');
});


app.get('/register', (req, res) => res.render("register.hbs"));
app.get('/login', (req, res) => res.render("login.hbs"));
app.get('/verify-email', (req, res) => res.render("verify-email.hbs"));


app.use("/user", userRouter);
app.use("/profileMain", isAuth, requireVerified, profileRouter);
app.use("/trainingPlan", isAuth, requireVerified, trainPlanRouter);
app.use("/trainMode", isAuth, requireVerified, trainModeRouter);


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