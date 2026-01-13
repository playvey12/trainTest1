const express = require("express");
const path = require("path");
const hbs = require("hbs");
const db = require("./data/bin/db");

const trainData = require("./data/trainData");

const isAuth = require("./middleware/all.middleware");

const port = process.env.PORT || 3333;
const app = express();
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')

const profileRouter = require("./routers/profileRouter");
const trainModeRouter = require("./routers/trainModeRouter");
const trainPlanRouter = require("./routers/trainPlanRouter");


const jwtSecret = process.env.JWT_SECRET || 'fallback';





app.use(express.static(path.join(__dirname, "./public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.get('/verify-token', isAuth, (req, res) => {
  res.json({ 
    isAuthenticated: true, 
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
});

// REGISTER USER
app.post('/register', (req, res) => {
  const { userEmail, userPassword } = req.body;
  const hashPassword = bcrypt.hashSync(userPassword, 10);
  
  db.run('INSERT INTO users(email,password) VALUES (?,?)', 
    [userEmail, hashPassword], 
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ error: 'Данный email уже зарегестрирован' });
        }
        return res.status(500).json({ 
          error: 'eror',
          details: err.message 
        });
      }
      const userId = this.lastID;
      res.status(201).json({
        message: "user created",
        userEmail,
        userId: userId
      });
    }
  );
});
//USER auth
app.post('/login', (req, res) => {
  const { userEmail, userPassword } = req.body;
db.get('SELECT id,email,password FROM users WHERE email=?',[userEmail],(err,user)=>{
if(err)return res.status(500).json({ 
        error: 'eror',
        details: err.message 
      });
      if(!user)return res.status(401).json({eror:"bad email or password"})
        const ok=bcrypt.compareSync(userPassword,user.password)
      if(!ok) return res.status(401).json({eror:"bad email or password"})

        const token =jwt.sign({
      id:user.id,
      email:user.email
        },jwtSecret,{expiresIn:'7d'})
        res.json({
          message:"user signUP",
          token
        })
        
        
})

})





app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "/views/partials"));

app.get('/register',(req,res)=>{
    res.render("register.hbs");
})
app.get('/login',(req,res)=>{
    res.render("login.hbs");
})

app.use("/profileMain",isAuth, profileRouter);

app.use("/trainingPlan",isAuth, trainPlanRouter);
app.use("/trainMode",isAuth, trainModeRouter);


app.use((req, res, next) => res.status(404).send("<h2>Not found</h2>"));

app.listen(port, () => {
  console.log(`Server running on port ${port}: http://localhost:${port}/`);
});