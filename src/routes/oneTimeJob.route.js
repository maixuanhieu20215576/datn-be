const express = require("express");
const router = express.Router();
const oneTimeJobController = require("../controllers/oneTimeJob.controller");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/update-questions", oneTimeJobController.updateQuestions);
router.post("/update-salaries", oneTimeJobController.updateSalaries);
router.post("/get-vietqr-bankcode", oneTimeJobController.getVietQRBankCode);
router.post("/create-admin-message", oneTimeJobController.createAdminMessage);
router.post("/create-course-unit", oneTimeJobController.createCourseUnit);
router.post(
  "/create-file-test-s3",
  upload.single("file"),
  oneTimeJobController.createFileTestS3
);

router.post('/health-check', (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});

module.exports = router;
