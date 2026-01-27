const express = require("express");
const router = express.Router();
const {regNewUser,confirmReg,resendCode,userLogin} = require("./postRouter");


router.post('/register',regNewUser )
router.post('/confirm-registration',confirmReg)
router.post('/resend-confirmation-code',resendCode)
router.post('/login',userLogin)






module.exports= router