const teacherService = require("../services/teacher.service");

const getTeachingStatistics = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { timePeriod } = req.query;
    const teachingStatistics = await teacherService.getTeachingStatistics({
      teacherId,
      timePeriod,
    });
    res.status(200).json(teachingStatistics);
  } catch (err) {
    res.status(500).json(err);
  }
};

const getTeachingStatisticsByClass = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { timePeriod } = req.query;
    const teachingStatisticsByClass =
      await teacherService.getTeachingStatisticsByClass({
        teacherId,
        timePeriod,
      });
    res.status(200).json(teachingStatisticsByClass);
  } catch (err) {
    res.status(500).json(err);
  }
};

const getTeacherProfile = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacherProfile = await teacherService.getTeacherProfile(teacherId);
    res.status(200).json(teacherProfile);
  } catch (err) {
    res.status(500).json(err);
  }
};

const getTeacherComments = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { page, limit } = req.query;

    const { comments, totalPages } = await teacherService.getTeacherComments({
      teacherId,
      page,
      limit,
    });
    res.status(200).json({
      comments,
      totalPages,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

module.exports = {
  getTeachingStatistics,
  getTeachingStatisticsByClass,
  getTeacherProfile,
  getTeacherComments,
};
