const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET || 'fallback';
const db = require("../data/bin/db");
const templateMailer = require("../EmailService/templateMailer");

const isAuth = (req, res, next) => {
if (req.path.startsWith('/css/') || req.path.startsWith('/js/') || req.path.startsWith('/img/')) {
    return next();
  }
  const publicPaths = [
    '/', '/login', '/register', 
    '/verify-token', 
    '/css/', '/js/', '/img/'
  ];
  

  let token = null;
  

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }
  

  else if (req.query.token) {
    token = req.query.token;

  }
  
  if (!token) {
    // Если запрос ожидает JSON (наш случай с fetch)
    if (req.headers.accept && req.headers.accept.includes('application/json') || req.path.includes('userData')) {
        return res.status(401).json({
            isAuthenticated: false,
            message: "Токен не предоставлен"
        });
    }
    return res.redirect('/login');
}
  
  try {
   
    const decoded = jwt.verify(token, jwtSecret);
    
  
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    

    
    next();
  } catch (error) {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(401).json({ error: "Невалидный токен" });
    }
    return res.redirect('/login');
}
};

const requireVerified = (req, res, next) => {
  db.get('SELECT is_verified FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка проверки статуса пользователя' });
    }
    
    if (!user || !user.is_verified) {
      return res.status(403).json({ 
        error: 'Требуется подтверждение email',
        redirectTo: '/login'
      });
    }
    
    next();
  });
};
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
module.exports = {
  isAuth,
  requireVerified,
  sendVerificationCode
};