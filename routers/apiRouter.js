const express = require("express");
const router = express.Router();
const {generateWorkout}=require("./postRouter")

router.post("/workoutData/generate", generateWorkout);

module.exports=router