const _ = require("lodash");
const classModel = require("../models/class.model");
const orderSessionModel = require("../models/orderSession.model");
const { constants } = require("../constant");
const learningProcessModel = require("../models/learningProcess.model");
const teachingHistoryModel = require("../models/teachingHistory.model");
const User = require("../models/user.model");
const moment = require("moment");
const ApplicationForm = require("../models/applicationForm.model");
const { default: mongoose } = require("mongoose");
const Comment = require("../models/comment.model");

const getTeachingStatistics = async ({ teacherId, timePeriod }) => {
  try {
    // Xác định mốc thời gian
    let startDate, endDate;

    switch (timePeriod) {
      case "week":
        startDate = moment().startOf("week").toDate();
        endDate = moment().endOf("week").toDate();
        break;
      case "month":
        startDate = moment().startOf("month").toDate();
        endDate = moment().endOf("month").toDate();
        break;
      case "year":
        startDate = moment().startOf("year").toDate();
        endDate = moment().endOf("year").toDate();
        break;
      default:
        startDate = null;
        endDate = null;
    }

    const classDetail = await classModel.find({
      teacherId,
    });

    const classIds = _.map(classDetail, (classItem) =>
      _.toString(_.get(classItem, "_id"))
    );

    const orderSessions = await orderSessionModel.find({
      status: constants.paymentStatus.success,
      classId: { $in: classIds },
      ...(startDate &&
        endDate && {
          createdAt: { $gte: startDate, $lte: endDate },
        }),
    });

    const totalRevenue = _.sumBy(orderSessions, "price");
    const totalClass = _.size(classDetail);

    const learningProcesses = await learningProcessModel.find({
      teacherId,
      ...(startDate &&
        endDate && {
          createdAt: { $gte: startDate, $lte: endDate },
        }),
    });

    const validRatings = learningProcesses.filter(
      (lp) => typeof lp.ratingByUser === "number"
    );

    const averageRatingByUser =
      validRatings.length > 0
        ? _.sumBy(validRatings, "ratingByUser") / validRatings.length
        : 0;

    const teachingHistory = await teachingHistoryModel.find({
      teacherId,
      ...(startDate &&
        endDate && {
          createdAt: { $gte: startDate, $lte: endDate },
        }),
    });

    const totalTeachingDay = _.size(teachingHistory);

    return {
      totalRevenue,
      totalClass,
      averageRatingByUser,
      totalTeachingDay,
    };
  } catch (err) {
    throw new Error(err);
  }
};

const getTeachingStatisticsByClass = async ({ teacherId, timePeriod }) => {
  try {
    // Xác định mốc thời gian
    let startDate, endDate;

    switch (timePeriod) {
      case "week":
        startDate = moment().startOf("week").toDate();
        endDate = moment().endOf("week").toDate();
        break;
      case "month":
        startDate = moment().startOf("month").toDate();
        endDate = moment().endOf("month").toDate();
        break;
      case "year":
        startDate = moment().startOf("year").toDate();
        endDate = moment().endOf("year").toDate();
        break;
      default:
        startDate = null;
        endDate = null;
    }

    const classDetails = await classModel.find({
      teacherId,
    });
    const teachingStatisticsByClass = [];
    for (const classDetail of classDetails) {
      const teachingStatisticsByClassItem = {
        className: classDetail.className,
        rating: classDetail.rating,
        totalStudents: classDetail.currentStudent,
        maxStudents: classDetail.maxStudent,
      };

      const classId = _.toString(_.get(classDetail, "_id"));
      const orderSessions = await orderSessionModel.find({
        status: constants.paymentStatus.success,
        classId,
        ...(startDate &&
          endDate && {
            createdAt: { $gte: startDate, $lte: endDate },
          }),
      });
      const totalRevenue = _.sumBy(orderSessions, "price");
      teachingStatisticsByClassItem.totalRevenue = totalRevenue;
      teachingStatisticsByClass.push(teachingStatisticsByClassItem);
    }

    return teachingStatisticsByClass;
  } catch (err) {
    throw new Error(err);
  }
};

const getTeacherProfile = async (teacherId) => {
  try {
    const teacherDetail = await User.findOne({
      _id: teacherId,
      role: constants.userRole.teacher,
    });
    if (!teacherDetail) {
      throw new Error("Teacher not found");
    }
    const teacher = {
      teacherName: teacherDetail.fullName,
      phoneNumber: teacherDetail.phoneNumber,
      email: teacherDetail.email,
      avatar: teacherDetail.avatar,
      teachingLanguage: _.map(
        teacherDetail.teachingInfo.teachingLanguage,
        (item) => constants.languages[item]
      ),
      startWorkAt: teacherDetail.teachingInfo.startWorkAt,
    };

    const applicationForms = await ApplicationForm.find({
      userId: teacherId,
      status: constants.applicationStatus.approved,
    });

    const teacherSkills = [];
    for (const applicationForm of applicationForms) {
      teacherSkills.push({
        languageSkills: applicationForm.languageSkills,
        teachingLanguage: applicationForm.teachingLanguage,
      });
    }

    teacher.teacherSkills = teacherSkills;
    const teachingClasses = await classModel.find({
      teacherId,
      status: constants.classStatus.open,
    });

    const teachingClass = [];
    for (const teachingClassItem of teachingClasses) {
      teachingClass.push({
        classId: teachingClassItem._id,
        className: teachingClassItem.className,
      });
    }
    teacher.teachingClass = teachingClass;
    return teacher;
  } catch (err) {
    throw new Error(err);
  }
};

const getTeacherComments = async ({ teacherId, page, limit }) => {
  try {
    const teacherComments = await Comment.find({
      teacherId: new mongoose.Types.ObjectId(teacherId),
    })
      .populate("userId", "fullName avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalComments = await Comment.countDocuments({
      teacherId: new mongoose.Types.ObjectId(teacherId),
    });

    const totalPages = Math.ceil(totalComments / limit);
    const comments = teacherComments.map((comment) => ({
      userId: comment.userId._id,
      userName: comment.userId.fullName,
      avatar: comment.userId.avatar,
      rating: comment.rating,
      content: comment.content,
      createdAt: moment(comment.createdAt).format("YYYY-MM-DD"),
    }));
    return {
      comments,
      totalPages,
    };
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = {
  getTeachingStatistics,
  getTeachingStatisticsByClass,
  getTeacherProfile,
  getTeacherComments,
};
