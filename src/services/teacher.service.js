const _ = require("lodash");
const classModel = require("../models/class.model");
const orderSessionModel = require("../models/orderSession.model");
const { constants } = require("../constant");
const learningProcessModel = require("../models/learningProcess.model");
const teachingHistoryModel = require("../models/teachingHistory.model");

const moment = require("moment");

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
module.exports = { getTeachingStatistics, getTeachingStatisticsByClass };
