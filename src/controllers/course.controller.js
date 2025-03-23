const courseService = require("../services/course.service");
const getCourse = async (req, res) => {
  try {
    const requestBody = req.body;
    const { courses, totalCourses } =
      await courseService.getCourse(requestBody);
    res.status(200).json({ courses, totalCourses });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    res.status(500).json("Internal Server Error");
  }
};

const getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await courseService.getCourseById(courseId);
    res.status(200).json({ course });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    res.status(500).json("Internal Server Error");
  }
};
module.exports = { getCourse, getCourseById };
