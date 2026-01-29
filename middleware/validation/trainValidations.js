const { body, param } = require('express-validator');

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const taskValidation = [
    body('day').optional().isIn(daysOfWeek).withMessage("Некорректный день недели"),
    body('exerciseName').trim().notEmpty().withMessage("Название упражнения обязательно")
        .isLength({ max: 100 }).withMessage("Название слишком длинное")
        .escape(), 
    body('weight').isFloat({ min: 0, max: 1000 }).withMessage("Вес должен быть от 0 до 1000"),
    body('approaches').isInt({ min: 1, max: 100 }).withMessage("Подходы должны быть от 1 до 100")
];
const taskValidationTrainMode = [
    body('weight').isFloat({ min: 0, max: 1000 }).withMessage("Вес должен быть от 0 до 1000"),
];

const idParamValidation = [
    param('id')
        .isString()
        .notEmpty()
        .withMessage("Некорректный ID задачи")
];
module.exports={
    taskValidation,idParamValidation,taskValidationTrainMode
}