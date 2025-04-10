const express = require("express");
const router = express.Router();
const oneTimeJobController = require("../controllers/oneTimeJob.controller");

router.post("/update-questions", oneTimeJobController.updateQuestions);
router.post("/update-salaries", oneTimeJobController.updateSalaries);
router.post("/get-vietqr-bankcode", oneTimeJobController.getVietQRBankCode);
router.post("/create-admin-message", oneTimeJobController.createAdminMessage);
module.exports = router;
