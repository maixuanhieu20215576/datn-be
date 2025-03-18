const express = require("express");
const router = express.Router();
const oneTimeJobController = require("../controllers/oneTimeJob.controller");

router.post('/update-questions', oneTimeJobController.updateQuestions)
module.exports = router;
