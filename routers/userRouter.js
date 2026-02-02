const express = require("express");
const router = express.Router();
const { regNewUser, confirmReg, resendCode, userLogin,forgotPassword,resetPassword } = require("./postRouter");
const { body } = require('express-validator');
const { regValidation, loginValidation } = require("../middleware/validation/userValidations");
const { changePassword } = require("./postRouter");
const {isAuth} = require("../middleware/all.middleware");



router.post('/register', regValidation, regNewUser);

router.post('/confirm-registration', [
  body('userEmail').isEmail().normalizeEmail(),
  body('confirmationCode').isLength({ min: 6, max: 6 }).isNumeric().withMessage("Код должен состоять из 6 цифр")
], confirmReg);

router.post('/resend-confirmation-code', [
  body('email').isEmail().withMessage("Некорректный email").normalizeEmail()
], resendCode);

router.post('/login', loginValidation, userLogin);



router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], forgotPassword);
router.post('/change-password', 
    isAuth, 
    [
        body('oldPassword').notEmpty().withMessage("Введите старый пароль"),
        body('newPassword').isLength({ min: 8 }).withMessage("Новый пароль должен быть от 8 символов")
    ], 
    changePassword
);

router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 6, max: 6 }),
  body('newPassword').isLength({ min: 8 })
], resetPassword);

module.exports = router;