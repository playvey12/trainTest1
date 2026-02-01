const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка хранилища
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './public/uploads/avatars';
        // Создаем папку, если её нет
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Называем файл по ID пользователя, чтобы не плодить дубликаты
        // Например: avatar_1.jpg
        const userId = req.user.id;
        const ext = path.extname(file.originalname);
        cb(null, `avatar_${userId}${ext}`);
    }
});

const upload = multer({ storage: storage });
module.exports={
upload
}