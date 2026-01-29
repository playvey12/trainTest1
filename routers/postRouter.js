const trainList = require("../data/trainData");
const {sendVerificationCode} = require("../middleware/all.middleware");
const db = require("../data/bin/db");
const {getRandomInt} =require("../utils/random")
const { notifyRegistration } = require('../services/notifier');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'fallback';
const { body, validationResult } = require('express-validator');

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
    // --- ТЕЛЕГРАМ: Уведомление об ошибке (очень полезно!) ---
    notifyRegistration(`⚠️ Ошибка регистрации!\nEmail: ${req.body.userEmail}\nError: ${error.message}`);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}
async function confirmReg(req,res) {
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
module.exports = {addTask,regNewUser,confirmReg,resendCode,userLogin,addLogExercise};
