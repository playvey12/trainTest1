const express = require("express");
const router = express.Router();

const trainList = require("../data/trainData");
const { 
  editUserWeight,
  editUserName,
  editUserTheme,editTgUserName,avatarEdit} = require("./putRouter"); 
const { weightValidation, themeValidation, userNameValidation } = require("../middleware/validation/userValidations");
const { getUserData,getUniqeExercises,getProfileData } = require("./getRouter");
const { upload } = require("../data/bin/FileMenager");
const {updateStats}=require("./postRouter")
router.get("/", getProfileData)

router.put("/edit",weightValidation, editUserWeight);
router.put("/userTheme/edit",themeValidation, editUserTheme);
router.put("/userName/edit",userNameValidation, editUserName);
router.put("/tgUserName/edit", editTgUserName);
router.put("/avatar/edit",upload.single('avatar'), avatarEdit);


router.get("/userData",getUserData)
router.get("/unique-exercises",  getUniqeExercises) 

router.post('/updateStats',updateStats)
module.exports = router;