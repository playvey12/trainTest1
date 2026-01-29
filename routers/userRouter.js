const express = require("express");
const router = express.Router();
const { regNewUser, confirmReg, resendCode, userLogin } = require("./postRouter");
const { body } = require('express-validator');
const { regValidation, loginValidation } = require("../middleware/validation/userValidations");




router.post('/register', regValidation, regNewUser);

router.post('/confirm-registration', [
  body('userEmail').isEmail().normalizeEmail(),
  body('confirmationCode').isLength({ min: 6, max: 6 }).isNumeric().withMessage("Код должен состоять из 6 цифр")
], confirmReg);

router.post('/resend-confirmation-code', [
  body('email').isEmail().withMessage("Некорректный email").normalizeEmail()
], resendCode);

router.post('/login', loginValidation, userLogin);

module.exports = router;