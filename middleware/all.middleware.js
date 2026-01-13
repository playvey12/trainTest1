const jwt = require("jsonwebtoken");
const jwtSecret = 'PLAYVEY123';

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

module.exports = isAuth;  