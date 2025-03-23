const express = require("express");
const router = express.Router();
const courseController = require("../controllers/course.controller");

router.post("/get-courses", courseController.getCourse);
router.get("/:id", courseController.getCourseById);

module.exports = router;
