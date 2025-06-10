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

const checkCoursePurchased = async (req, res) => {
  try {
    const { userId, courseId, classId } = req.body;
    const result = await courseService.checkCoursePurchased({
      userId,
      courseId,
      classId,
    });
    res.status(200).json({ result });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    res.status(500).json("Internal Server Error");
  }
};

const findClass = async (req, res) => {
  try {
    const { date, timeFrom, teacherName, timeTo } = req.body;
    const result = await courseService.findClass({
      date,
      timeFrom,
      teacherName,
      timeTo,
    });
    res.status(200).json({ result });
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    res.status(500).json("Internal Server Error");
  }
};

const getRegisteredClass = async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await courseService.getRegisteredClass({ userId });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ err });
  }
};

const getCourseUnit = async (req, res) => {
  try {
    const { courseId, userId } = req.body;
    const result = await courseService.getCourseUnit({ courseId, userId });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ err });
  }
};

const getUnitContent = async (req, res) => {
  try {
    const { lectureId, courseId, userId } = req.body;
    const {
      lectureContent,
      parentUnit,
      courseName,
      nextLectureId,
      lastLectureId,
      status,
    } = await courseService.getUnitContent({ lectureId, courseId, userId });
    res.status(200).json({
      lectureContent,
      parentUnit,
      courseName,
      nextLectureId,
      lastLectureId,
      status,
    });
  } catch (err) {
    res.status(500).json({ err });
  }
};

const createCourse = async (req, res) => {
  try {
    const newCourse = await courseService.createCourse(req);
    res.status(200).json(newCourse);
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateCourseLearningProcessStatus = async (req, res) => {
  try {
    const { userId, courseId, unitId, status } = req.body;
    const result = await courseService.updateCourseLearningProcessStatus({
      userId,
      courseId,
      unitId,
      status,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ err });
  }
};

const getCourseDiscussion = async (req, res) => {
  try {
    const { courseId, itemPerPage, page } = req.body;
    const result = await courseService.getCourseDiscussion({
      courseId,
      itemPerPage,
      page,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ err });
  }
};

const commentVote = async (req, res) => {
  try {
    const { commentId, type } = req.body;
    const result = await courseService.commentVote({ commentId, type });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ err });
  }
};

const editCourse = async (req, res) => {
  try {
    const newCourse = await courseService.editCourse(req);
    res.status(200).json(newCourse);
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  getCourse,
  getCourseById,
  checkCoursePurchased,
  findClass,
  getRegisteredClass,
  getCourseUnit,
  getUnitContent,
  createCourse,
  updateCourseLearningProcessStatus,
  getCourseDiscussion,
  commentVote,
  editCourse,
};
