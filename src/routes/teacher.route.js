const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacher.controller");
const multer = require("multer");
const uploadTestFiles = multer({ storage: multer.memoryStorage() }).any();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/statistics/:teacherId', teacherController.getTeachingStatistics);
router.get('/statistics-by-class/:teacherId', teacherController.getTeachingStatisticsByClass);
router.get('/profile/:teacherId', teacherController.getTeacherProfile);
router.get('/comments/:teacherId', teacherController.getTeacherComments);
router.get('/get-classes/:teacherId', teacherController.getClassesByTeacher);
router.post('/create-test', uploadTestFiles, teacherController.createTest);
router.post('/get-students-by-class', teacherController.getStudentsByClass);
module.exports = router;
