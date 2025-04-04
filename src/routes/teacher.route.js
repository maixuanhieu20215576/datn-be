const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacher.controller");

router.get('/statistics/:teacherId', teacherController.getTeachingStatistics);
router.get('/statistics-by-class/:teacherId', teacherController.getTeachingStatisticsByClass);
module.exports = router;
