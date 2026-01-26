const express = require("express");
const path = require("path");
const hbs = require("hbs");
const db = require("./data/bin/db");
const templateMailer = require("./EmailService/templateMailer");
const { isAuth, requireVerified } = require("./middleware/all.middleware");
const port = process.env.PORT || 3333;
const app = express();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const profileRouter = require("./routers/profileRouter");
const trainModeRouter = require("./routers/trainModeRouter");
const trainPlanRouter = require("./routers/trainPlanRouter");
const jwtSecret = process.env.JWT_SECRET || 'fallback';
const {getRandomInt} =require("./utils/random")




async function sendVerificationCode(email, code) {
  try {
    templateMailer.sendHello({
      to: email,
      templateVar: {
        code: code
      }
    });
    return true;
  } catch (error) {
    console.error("Error sending verification code:", error);
    return false;
  }
}

app.use(express.static(path.join(__dirname, "./public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.render("register.hbs");
});


app.post('/register', async (req, res) => {
  try {
    const { userEmail, userPassword } = req.body;
    
    db.get('SELECT id FROM users WHERE email = ?', [userEmail], async (err, existingUser) => {
      if (err) {
        return res.status(500).json({ 
          error: 'Ошибка базы данных',
          details: err.message 
        });
      }
      
      if (existingUser) {
        db.get('SELECT is_verified FROM users WHERE email = ?', [userEmail], (err, user) => {
          if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
          
          if (user.is_verified) {
            return res.status(400).json({ 
              error: 'Данный email уже зарегистрирован и подтвержден' 
            });
          } else {

            const newCode = getRandomInt(100000, 999999);
            const expiryTime = new Date(Date.now() + 30 * 60000); 
            
            db.run(
              'UPDATE users SET verification_code = ?, code_expires_at = ? WHERE email = ?',
              [newCode, expiryTime.toISOString(), userEmail],
              async (err) => {
                if (err) return res.status(500).json({ error: 'Ошибка обновления кода' });
                await sendVerificationCode(userEmail, newCode);
                return res.status(200).json({
                  message: 'Код подтверждения отправлен повторно',
                  email: userEmail
                });
              }
            );
          }
        });
      } else {
        const hashPassword = bcrypt.hashSync(userPassword, 10);
        const verificationCode = getRandomInt(100000, 999999);
        const expiryTime = new Date(Date.now() + 30 * 60000); 
        db.run(
          'INSERT INTO users(email, password, verification_code, code_expires_at) VALUES (?, ?, ?, ?)',
          [userEmail, hashPassword, verificationCode, expiryTime.toISOString()],
          async function(err) {
            if (err) {
              return res.status(500).json({ 
                error: 'Ошибка создания пользователя',
                details: err.message 
              });
            }
            const emailSent = await sendVerificationCode(userEmail, verificationCode);
            
            if (emailSent) {
              res.status(201).json({
                message: "Пользователь создан. Код подтверждения отправлен на email.",
                email: userEmail,
                userId: this.lastID
              });
            } else {
              res.status(201).json({
                message: "Пользователь создан, но не удалось отправить код подтверждения.",
                email: userEmail,
                userId: this.lastID,
                verificationCode: verificationCode // Возвращаем код для отладки (в продакшене удалить)
              });
            }
          }
        );
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Подтверждение регистрации
app.post('/confirm-registration', (req, res) => {
  const { userEmail, confirmationCode } = req.body;
  
  // Находим пользователя
  db.get(
    'SELECT id, verification_code, code_expires_at FROM users WHERE email = ?',
    [userEmail],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка базы данных' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }
      
      // Проверяем срок действия кода
      const now = new Date();
      const expiryTime = new Date(user.code_expires_at);
      
      if (now > expiryTime) {
        return res.status(400).json({ error: 'Срок действия кода истек' });
      }
      
      // Проверяем код
      if (user.verification_code !== confirmationCode) {
        return res.status(400).json({ error: 'Неверный код подтверждения' });
      }
      
     
      db.run(
        'UPDATE users SET is_verified = 1, verification_code = NULL, code_expires_at = NULL WHERE id = ?',
        [user.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Ошибка активации пользователя' });
          }
          
        
          const token = jwt.sign(
            {
              id: user.id,
              email: userEmail
            },
            jwtSecret,
            { expiresIn: '7d' }
          );
          
          res.json({
            message: "Email успешно подтвержден!",
            token: token,
            user: {
              id: user.id,
              email: userEmail
            }
          });
        }
      );
    }
  );
});

// Повторная отправка кода
app.post('/resend-confirmation-code', (req, res) => {
  const { email } = req.body;
  
  db.get('SELECT id, is_verified FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка базы данных' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    if (user.is_verified) {
      return res.status(400).json({ error: 'Email уже подтвержден' });
    }
    

    const newCode = getRandomInt(100000, 999999);
    const expiryTime = new Date(Date.now() + 30 * 60000);
    
    db.run(
      'UPDATE users SET verification_code = ?, code_expires_at = ? WHERE id = ?',
      [newCode, expiryTime.toISOString(), user.id],
      async (err) => {
        if (err) {
          return res.status(500).json({ error: 'Ошибка обновления кода' });
        }
        const emailSent = await sendVerificationCode(email, newCode);
        if (emailSent) {
          res.json({
            message: 'Новый код подтверждения отправлен на email',
            email: email
          });
        } else {
          res.status(500).json({ 
            error: 'Не удалось отправить код подтверждения',
            debugCode: newCode 
          });
        }
      }
    );
  });
});


app.post('/login', (req, res) => {
  const { userEmail, userPassword } = req.body;
  
  db.get('SELECT id, email, password, is_verified FROM users WHERE email = ?', [userEmail], (err, user) => {
    if (err) return res.status(500).json({ 
      error: 'Ошибка базы данных',
      details: err.message 
    });
    
    if (!user) return res.status(401).json({ error: "Неверный email или пароль" });
    
    const ok = bcrypt.compareSync(userPassword, user.password);
    if (!ok) return res.status(401).json({ error: "Неверный email или пароль" });
    

    if (!user.is_verified) {
      return res.status(403).json({ 
        error: "Email не подтвержден",
        email: user.email
      });
    }
    
    const token = jwt.sign({
      id: user.id,
      email: user.email
    }, jwtSecret, { expiresIn: '7d' });
    
    res.json({
      message: "Вход выполнен успешно",
      token
    });
  });
});



app.use("/profileMain", isAuth, requireVerified, profileRouter);
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