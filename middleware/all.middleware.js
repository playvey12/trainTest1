const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET || 'fallback';
const db = require("../data/bin/db");


const isAuth = (req, res, next) => {

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
    console.log("Токен не предоставлен для пути:", req.path);
    
 
    if (req.path.startsWith('/api/') || req.xhr) {
      return res.status(401).json({
        isAuthenticated: false,
        message: "Токен не предоставлен",
        path: req.path
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
    console.error("Ошибка верификации токена:", error.message);
 
  

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
        redirectTo: '/verify-email'
      });
    }
    
    next();
  });
};

module.exports = {
  isAuth,
  requireVerified
};