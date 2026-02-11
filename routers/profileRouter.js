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
const {updateStats}=require("./postRouter");
const { isAuth } = require("../middleware/all.middleware");
router.get("/", getProfileData)

router.put("/edit",weightValidation, editUserWeight);
router.put("/userTheme/edit",themeValidation, editUserTheme);
router.put("/userName/edit",userNameValidation, editUserName);
router.put("/tgUserName/edit", editTgUserName);
router.put("/avatar/edit",upload.single('avatar'), avatarEdit);


router.get("/userData",getUserData)
router.get("/unique-exercises",  getUniqeExercises) 

router.post('/updateStats',updateStats)

router.put("/change-language", isAuth, async (req, res) => {
    const { lang } = req.body;
    if (!['ru', 'en'].includes(lang)) return res.status(400).json({ error: "Invalid lang" });

    try {
        await trainList.editUserLanguage(req.user.id, lang);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

module.exports = router;