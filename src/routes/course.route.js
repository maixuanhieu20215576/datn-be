const express = require("express");
const router = express.Router();
const courseController = require("../controllers/course.controller");
const multer = require("multer");
const uploadCourseFiles = multer({ storage: multer.memoryStorage() }).any();

router.post("/get-courses", courseController.getCourse);
router.post("/check", courseController.checkCoursePurchased);
router.post("/get-class", courseController.findClass);
router.post("/get-registered-class", courseController.getRegisteredClass);
router.post("/get-course-unit", courseController.getCourseUnit);
router.post("/get-unit-content", courseController.getUnitContent);
router.post("/create-course", uploadCourseFiles, courseController.createCourse);
router.post("/update-course-learning-process-status", courseController.updateCourseLearningProcessStatus);
router.post("/get-course-discussion", courseController.getCourseDiscussion);
router.post('/comment-vote', courseController.commentVote);
router.get("/:id", courseController.getCourseById);

module.exports = router;
