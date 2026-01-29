const { body } = require('express-validator');
const regValidation = [
  body('userEmail').isEmail().withMessage("Некорректный email").normalizeEmail(),
  body('userPassword').isLength({ min: 8 }).withMessage("Пароль должен быть от 8 символов")
];

const loginValidation = [
  body('userEmail').isEmail().withMessage("Введите корректный email").normalizeEmail(),
  body('userPassword').notEmpty().withMessage("Пароль не может быть пустым")
];



const weightValidation = [
   
    body('userWeight')
        .optional()
        .isFloat({ min: 30, max: 500 })
        .withMessage("Вес должен быть числом от 30 до 500"),
        
    body('userGoalWeight')
        .optional()
        .isFloat({ min: 30, max: 500 })
        .withMessage("Целевой вес должен быть числом от 30 до 500"),
        
    body('userStartWeight')
        .optional()
        .isFloat({ min: 30, max: 500 })
        .withMessage("Начальный вес должен быть числом от 30 до 500")
];
const userNameValidation=[
   body('userName').trim().isLength({ min: 2, max: 30 }).withMessage("Имя от 2 до 30 символов").escape()

]


const themeValidation = [
    body('userTheme').isIn(['black', 'pink']).withMessage("Недопустимая тема")
];

const logExerciseValidation = [
  body('exerciseName').trim().notEmpty().escape(),
  body('weight').isFloat({ min: 0, max: 1000 }).withMessage("Вес должен быть числом")
];

module.exports={regValidation, loginValidation,weightValidation,themeValidation,userNameValidation,logExerciseValidation}