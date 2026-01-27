const express = require("express");
const path = require("path");
const hbs = require("hbs");
const { isAuth, requireVerified } = require("./middleware/all.middleware");
const port = process.env.PORT || 3333;
const app = express();
const profileRouter = require("./routers/profileRouter");
const trainModeRouter = require("./routers/trainModeRouter");
const userRouter = require("./routers/userRouter");
const trainPlanRouter = require("./routers/trainPlanRouter");


app.use(express.static(path.join(__dirname, "./public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render("register.hbs");
});

app.use("/profileMain", isAuth, requireVerified, profileRouter);
app.use("/user", userRouter);
app.use("/trainingPlan", isAuth, requireVerified, trainPlanRouter);
app.use("/trainMode", isAuth, requireVerified, trainModeRouter);

app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "/views/partials"));

app.get('/register', (req, res) => {
  res.render("register.hbs");
});

app.get('/login', (req, res) => {
  res.render("login.hbs");
});

app.get('/verify-email', (req, res) => {
  res.render("verify-email.hbs");
});

app.use((req, res, next) => res.status(404).send("<h2>Not found</h2>"));

app.listen(port, () => {
  console.log(`Server running on port ${port}: http://localhost:${port}/`);
});