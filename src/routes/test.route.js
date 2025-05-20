const express = require("express");
const router = express.Router();
const testController = require("../controllers/test.controller");

router.post("/get-tests", testController.getTests);
router.post("/get-test-question", testController.getTestQuestion);
router.post("/submit-answer", testController.submitAnswer);
router.post("/submit-test", testController.submitTest);
router.post("/get-test-result", testController.getTestResult);
router.post("/get-test-history", testController.getTestHistory);

module.exports = router;
