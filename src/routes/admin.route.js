const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/fetch-application-forms", adminController.fetchApplicationForms);
router.post(
  "/update-application-form-status",
  adminController.updateApplicationFormStatus
);
router.post("/fetch-teacher-list", adminController.fetchTeacherList);
router.post(
  "/create-class",
  upload.single("thumbnail"),
  adminController.createClass
);

router.post(
  "/update-class/:classId",
  upload.single("thumbnail"),
  adminController.updateClass
);

router.post("/fetch-class", adminController.fetchClass);
router.get("/fetch-class/:classId", adminController.fetchClassById);
router.get("/get-order-statistics", adminController.getOrderStatistics);
router.get("/get-monthly-sales", adminController.getMonthlySales);
router.get("/get-language-frequent", adminController.getLanguageFrequent);
router.post("/get-teachers-salary", adminController.getTeachersSalary);
router.post("/get-vietqr-payment", adminController.getVietQRPayment);
router.post("/salary-payment-complete", adminController.salaryPaymentComplete);

module.exports = router;
