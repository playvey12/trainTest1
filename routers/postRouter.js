const trainList = require("../data/trainData");
const {sendVerificationCode} = require("../middleware/all.middleware");
const db = require("../data/bin/db");
const {getRandomInt} =require("../utils/random")
const { notifyRegistration } = require('../services/notifier');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'fallback';
const { body, validationResult } = require('express-validator');
const templateMailer  = require('../EmailService/templateMailer');
const {generateWorkoutData}=require('../services/trainPlanAiYandexGpt')

// Настройки куки (вынес в переменную для удобства)
// На бэкенде
const cookieOptions = {
    httpOnly: true,
    secure: true, // Всегда true для работы в Telegram
    sameSite: 'None', 
    maxAge: 30 * 24 * 60 * 60 * 1000
};

async function updateStats(req, res) {
const { addWorkout, hoursToAdd } = req.body;
    const userId = req.user.id; 

    try {
        const updatedStats = await trainList.updateProfileStats(userId, {
            addWorkout,
            hoursToAdd
        });

        res.json({ 
            success: true, 
            stats: updatedStats 
        });
    } catch (e) {
        console.error("Ошибка при обновлении статистики:", e);
        res.status(500).json({ error: "Ошибка сервера при сохранении статистики" });
    }
}

async function addTask(req, res) {
  try {
     const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    const dataFromClient = req.body;
    const userId = req.user.id;

    if (!dataFromClient.day) {
      dataFromClient.day = "Monday";
    }

    const result = await trainList.addTask(userId, dataFromClient);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in addTask:", error);
    res.status(500).json({ error: error.message });
  }
}

async function regNewUser(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Ошибка валидации', 
        details: errors.array().map(err => err.msg) 
      });
    }
    const { userEmail, userPassword } = req.body;

    db.get('SELECT id FROM users WHERE email = ?', [userEmail], async (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка базы данных', details: err.message });
      }

      if (existingUser) {
        db.get('SELECT is_verified FROM users WHERE email = ?', [userEmail], (err, user) => {
          if (err) return res.status(500).json({ error: 'Ошибка базы данных' });

          if (user.is_verified) {
            return res.status(400).json({ error: 'Данный email уже зарегистрирован и подтвержден' });
          } else {
            const newCode = getRandomInt(100000, 999999);
            const expiryTime = new Date(Date.now() + 30 * 60000);

            db.run(
              'UPDATE users SET verification_code = ?, code_expires_at = ? WHERE email = ?',
              [newCode, expiryTime.toISOString(), userEmail],
              async (err) => {
                if (err) return res.status(500).json({ error: 'Ошибка обновления кода' });
                
                await sendVerificationCode(userEmail, newCode);
                
                notifyRegistration(`🔄 Повторный код для: ${userEmail}`);

                return res.status(200).json({
                  message: 'Код подтверждения отправлен повторно',
                  email: userEmail
                });
              }
            );
          }
        });
      } else {
        
      const hashPassword = await bcrypt.hash(userPassword, 10);
        const verificationCode = getRandomInt(100000, 999999);
        const expiryTime = new Date(Date.now() + 30 * 60000);

        db.run(
          'INSERT INTO users(email, password, verification_code, code_expires_at) VALUES (?, ?, ?, ?)',
          [userEmail, hashPassword, verificationCode, expiryTime.toISOString()],
          async function (err) {
            if (err) {
              return res.status(500).json({ error: 'Ошибка создания пользователя', details: err.message });
            }

            const emailSent = await sendVerificationCode(userEmail, verificationCode);

            db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                const total = row ? row.count : '?';
                notifyRegistration(`🚀 НОВЫЙ ЮЗЕР: ${userEmail}\n📊 Всего в базе: ${total}`);
            });

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
                verificationCode: verificationCode
              });
            }
          }
        );
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    notifyRegistration(`⚠️ Ошибка регистрации!\nEmail: ${req.body.userEmail}\nError: ${error.message}`);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

async function confirmReg(req, res) {
  const { userEmail, confirmationCode } = req.body;

  db.get(
    'SELECT id, verification_code, code_expires_at FROM users WHERE email = ?',
    [userEmail],
    (err, user) => {
      if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
      if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

      const now = new Date();
      const expiryTime = new Date(user.code_expires_at);

      if (now > expiryTime) {
        return res.status(400).json({ error: 'Срок действия кода истек' });
      }

      if (String(user.verification_code) !== String(confirmationCode)) {
        return res.status(400).json({ error: 'Неверный код подтверждения' });
      }

      db.run(
        'UPDATE users SET is_verified = 1, verification_code = NULL, code_expires_at = NULL WHERE id = ?',
        [user.id],
        function(err) {
          if (err) return res.status(500).json({ error: 'Ошибка активации пользователя' });

          const token = jwt.sign(
            { id: user.id, email: userEmail },
            jwtSecret,
            { expiresIn: '7d' }
          );

          // УСТАНОВКА КУКИ
          res.cookie('token', token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

          res.json({
            message: "Email успешно подтвержден!",
            token: token,
            user: { id: user.id, email: userEmail }
          });
        }
      );
    }
  );
}

async function resendCode(req,res) {
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
}

async function userLogin(req,res){
  const errors = validationResult(req);
 const { userEmail, userPassword } = req.body;
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Неверный формат данных', details: errors.array() });
  }
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

    // УСТАНОВКА КУКИ
    res.cookie('token', token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    res.json({
      message: "Вход выполнен успешно",
      token
    });
  });
}

async function addLogExercise(req,res){
 try {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    const userId = req.user.id;
    const { exerciseName, weight } = req.body;
    
    if (!exerciseName || weight === undefined) {
      return res.status(400).json({ error: "Exercise name and weight are required" });
    }
    
    const newEntry = await trainList.addExerciseToHistory(userId, exerciseName, weight);
    
    res.json({
      success: true,
      message: "Exercise progress logged successfully",
      entry: newEntry
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
}

async function forgotPassword(req, res) {
    const { email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 3600000).toISOString(); // 1 час

    db.run(
        'UPDATE users SET verification_code = ?, code_expires_at = ? WHERE email = ?',
        [code, expires, email],
        function(err) {
            if (err) return res.status(500).json({ error: "Ошибка БД" });
            if (this.changes === 0) return res.status(404).json({ error: "Пользователь не найден" });

            templateMailer.sendResetPassword({ 
                to: email, 
                templateVar: { code: code } 
            });

            res.json({ message: "Код для восстановления отправлен!" });
        }
    );
}

async function resetPassword(req, res) {
    const { email, code, newPassword } = req.body;

    db.get('SELECT verification_code, code_expires_at FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Ошибка базы данных' });
        if (!user || String(user.verification_code) !== String(code)) {
            return res.status(400).json({ error: 'Неверный код подтверждения' });
        }

        if (new Date() > new Date(user.code_expires_at)) {
            return res.status(400).json({ error: 'Срок действия кода истек' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        db.run(
            'UPDATE users SET password = ?, verification_code = NULL, code_expires_at = NULL WHERE email = ?',
            [hashed, email],
            (err) => {
                if (err) return res.status(500).json({ error: 'Ошибка при сохранении пароля' });
                res.json({ message: 'Пароль успешно изменен!' });
            }
        );
    });
}

async function saveUserAiData(req, res) {
    try {
        const userId = req.user.id;
        const { 
            userWeightAi, 
            userHeightAi, 
            userAgeAi, 
            userExperienceAi, 
            userInjuriesAi 
        } = req.body;

        if (!userWeightAi || !userHeightAi || !userAgeAi) {
             return res.status(400).json({ error: "Основные поля не заполнены" });
        }

        await trainList.updateUserAiParams(userId, {
            userWeightAi,
            userHeightAi,
            userAgeAi,
            userExperienceAi,
            userInjuriesAi
        });

        res.json({ success: true, message: "Данные AI успешно сохранены" });

    } catch (error) {
        console.error("Save AI Data Error:", error);
        res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
}

async function changePassword(req, res) {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;
        if (!oldPassword || !newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: "Заполните все поля корректно" });
        }
        db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
            if (err) return res.status(500).json({ error: "Ошибка при обращении к БД" });
            if (!user) return res.status(404).json({ error: "Пользователь не найден" });
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: "Текущий пароль введен неверно" });
            }
            if (oldPassword === newPassword) {
                return res.status(400).json({ error: "Новый пароль не может совпадать со старым" });
            }
            const hashPassword = await bcrypt.hash(newPassword, 10);
            db.run(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashPassword, userId],
                function(updateErr) {
                    if (updateErr) return res.status(500).json({ error: "Не удалось обновить пароль" });
                    res.json({ success: true, message: "Пароль успешно изменен" });
                }
            );
        });
    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
}

async function generateWorkout(req, res) {
  try {
    const userId = req.user.id;
    const userData = await trainList.getUserDataDB(userId);
    const profile = userData.profileWeightList;

    if (!profile.userWeightAi || !profile.userHeightAi) {
      return res.status(400).json({ 
        message: "Пожалуйста, сначала заполните данные в форме профиля!" 
      });
    }

    const aiPlanArray = await generateWorkoutData({
      userWeightAi: profile.userWeightAi,
      userHeightAi: profile.userHeightAi,
      userAgeAi: profile.userAgeAi,
      userExperienceAi: profile.userExperienceAi,
      userInjuriesAi: profile.userInjuriesAi
    });

    const newTrainData = {
      Monday: [], Tuesday: [], Wednesday: [], 
      Thursday: [], Friday: [], Saturday: [], Sunday: []
    };

    aiPlanArray.forEach(ex => {
        const dayMap = { "Пн": "Monday", "Вт": "Tuesday", "Ср": "Wednesday", "Чт": "Thursday", "Пт": "Friday", "Сб": "Saturday", "Вс": "Sunday" };
        const englishDay = dayMap[ex.dayRussian] || "Monday";
        
        newTrainData[englishDay].push({
            id: ex.id || `ai_${Math.random().toString(36).substr(2, 9)}`,
            exerciseName: ex.exerciseName,
            weight: ex.weight,
            approaches: ex.approaches,
            day: englishDay,
            dayRussian: ex.dayRussian
        });
    });

    await trainList.saveUserDataDB(userId, "train_data", newTrainData);
    res.json({ success: true, plan: newTrainData });
    
  } catch (error) {
    console.error("Ошибка генерации плана:", error);
    res.status(500).json({ message: "Техническая ошибка при создании плана" });
  }
}

const crypto = require('crypto');

async function tgLogin(req, res) {
    try {
        const { initData } = req.body;
        const botToken = process.env.TELEGRAM_APP_BOT_TOKEN;
        if (!botToken) {
            console.error("  TELEGRAM_APP_BOT_TOKEN не найден. Проверь файл .env!");
            return res.status(500).json({ error: "Server configuration error (missing token)" });
        }
        if (!initData) return res.status(400).json({ error: "No initData" });
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');
        const dataCheckString = Array.from(urlParams.entries())
            .map(([key, value]) => `${key}=${value}`)
            .sort()
            .join('\n');
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
        if (hmac !== hash) return res.status(403).json({ error: "Invalid signature" });
        const userStr = urlParams.get('user');
        if (!userStr) return res.status(400).json({ error: "User data is missing in initData" });
        const userTg = JSON.parse(userStr);
        const telegramId = String(userTg.id);
        db.get('SELECT id, email FROM users WHERE telegram_id = ?', [telegramId], (err, user) => {
            if (err) {
              
                console.error("❌ ОШИБКА БД ПРИ ПОИСКЕ ЮЗЕРА:", err.message);
                return res.status(500).json({ error: "DB Error (SELECT)", details: err.message });
            }

            if (user) {
               
                const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: '30d' });
                
           
                res.cookie('token', token, cookieOptions);
                return res.json({ token });

            } else {
             
                const tempEmail = `tg_${telegramId}@yourbot.com`;
                db.run('INSERT INTO users(email, password, is_verified, telegram_id) VALUES (?, ?, 1, ?)', 
    [tempEmail, 'tg_auto_pass', telegramId], function(err) {
        if (err) {
       
            console.error("❌ КРИТИЧЕСКАЯ ОШИБКА РЕГИСТРАЦИИ:", err.message);
            return res.status(500).json({ error: "Этот аккаунт уже привязан" });
        }
        
        const userId = this.lastID;
        console.log(`✅ Успешно создан новый пользователь с ID: ${userId}`)
                        const token = jwt.sign({ id: userId, email: tempEmail }, jwtSecret, { expiresIn: '30d' });

                        db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
                            const total = row ? row.count : '?';
                            notifyRegistration(`🚀 НОВЫЙ TG ЮЗЕР: ID ${telegramId}\n📊 Всего в базе: ${total}`);
                        });

                        res.cookie('token', token, cookieOptions);
                        return res.json({ token });
                    });
            } 
        });
    } catch (e) {
       
        console.error("❌ ГЛОБАЛЬНАЯ ОШИБКА В tgLogin:", e.stack || e);
        res.status(500).json({ error: "Server error catch block", details: e.message });
    }
}
module.exports = {tgLogin,generateWorkout,saveUserAiData,changePassword,resetPassword,forgotPassword,updateStats,addTask,regNewUser,confirmReg,resendCode,userLogin,addLogExercise};