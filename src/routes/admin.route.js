const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");

router.post("/fetch-application-forms", adminController.fetchApplicationForms);
router.post(
  "/update-application-form-status",
  adminController.updateApplicationFormStatus
);
router.post("/fetch-teacher-list", adminController.fetchTeacherList);
router.post("/create-class", adminController.createClass);

module.exports = router;
