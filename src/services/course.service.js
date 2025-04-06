const moment = require("moment");
const _ = require("lodash");
const Course = require("../models/course.model");
const Class = require("../models/class.model");
const OrderSession = require("../models/orderSession.model");
const { constants } = require("../constant");
const classModel = require("../models/class.model");

const _convertTimeToMilisecond = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours * 60 + minutes) * 60 * 1000;
};

const getCourse = async (requestBody) => {
  const {
    language,
    rating,
    level,
    priceFrom,
    priceTo,
    page,
    searchText,
    sortOption,
    userId,
  } = requestBody;

  if (userId) {
    const orderSessions = await OrderSession.find({
      userId: userId,
      status: constants.paymentStatus.success,
    });
    const courseIds = orderSessions.map((order) => order.courseId);
    const purchasedCourses = await Course.find({ _id: { $in: courseIds } });
    return { courses: purchasedCourses, totalCourses: purchasedCourses.length };
  }

  const filter = {};
  if (language) {
    filter.language = language;
  }
  if (rating) {
    filter.course_rating = { $gte: rating };
  }
  if (level) {
    filter.course_level = { $lte: level + 1, $gte: level };
  }
  if (priceFrom && priceTo) {
    filter.price_dis = { $gte: priceFrom, $lte: priceTo };
  } else {
    if (priceFrom) {
      filter.price_dis = { $gte: priceFrom / 1000 };
    }
    if (priceTo) {
      filter.price_dis = { $lte: priceTo / 1000 };
    }
  }
  if (searchText) {
    filter.course_name = new RegExp(searchText, "i");
  }
  let sortKey = { createAt: -1, _id: 1 };

  if (sortOption) {
    if (sortOption === "0") {
      sortKey = { createAt: -1, _id: 1 };
    }
    if (sortOption === "1") {
      sortKey = { course_rating: -1, _id: 1 };
    }
    if (sortOption === "2") {
      sortKey = { course_enrollmenters: 1, _id: 1 };
    }
  }
  const limit = 18;
  const skip = (page - 1) * limit;
  const courses = await Course.find(filter)
    .sort(sortKey)
    .skip(skip)
    .limit(limit);
  const totalCourses = await Course.countDocuments(filter);

  return { courses, totalCourses };
};

const getCourseById = async (courseId) => {
  const course = await Course.findById(courseId);
  return course;
};

const createPaymentRequest = async ({ price, userId, courseId, classId }) => {
  const newOrder = await OrderSession.create({
    courseId,
    userId,
    price,
    classId,
  });
  return _.toString(newOrder._id);
};

const checkCoursePurchased = async ({ userId, courseId, classId }) => {
  let order;
  if (classId) {
    order = await OrderSession.findOne({
      userId,
      classId,
      status: constants.paymentStatus.success,
    });
  } else {
    order = await OrderSession.findOne({
      userId,
      courseId,
      status: constants.paymentStatus.success,
    });
  }
  return !!order;
};

const findClass = async ({ date, timeFrom, teacherName, timeTo }) => {
  const filter = {};
  if (date) {
    filter.date = date;
  }
  if (timeFrom) {
    const timeFromMiliseconds = _convertTimeToMilisecond(timeFrom);
    filter.timeFrom = { $gte: timeFromMiliseconds };
  }
  if (timeTo) {
    const timeToMiliseconds = _convertTimeToMilisecond(timeTo);
    filter.timeTo = { $lte: timeToMiliseconds };
  }
  if (teacherName) {
    filter.stringForSearch = new RegExp(teacherName, "i");
  }
  const classes = await Class.find(filter);
  return classes;
};

const getRegisteredClass = async ({ userId }) => {
  try {
    const orderSessions = await OrderSession.find(
      { userId, status: constants.paymentStatus.success },
      {
        classId: 1,
      }
    );
    const classes = [];
    for (const orderSession of orderSessions) {
      const classId = _.get(orderSession, "classId");
      if (classId) {
        const classDetail = await classModel.findById(classId);
        let timeString;
        let canJoinClass;
        for (const schedule of classDetail.schedule) {
          const dateMoment = `${schedule.date} ${schedule.timeFrom}`;
          if (
            moment(dateMoment, "DD/MM/YYYY HH:mm").isBefore(
              moment(new Date(), "DD/MM/YYYY HH:mm")
            )
          ) {
            continue;
          }
          const followingClassTimeInMiliseconds =
            moment(dateMoment, "DD/MM/YYYY HH:mm").valueOf() - Date.now();
          canJoinClass =
            followingClassTimeInMiliseconds < 15 * 60 * 1000 * 1000; 
 
          const duration = moment.duration(followingClassTimeInMiliseconds);
          const days = Math.floor(duration.asDays());
          const hours = duration.hours();
          const minutes = duration.minutes();

          timeString = `${days} ngày ${hours} giờ ${minutes} phút`;
          break;
        }
        classes.push({
          _id: classDetail._id,
          className: classDetail.className,
          teacherName: classDetail.teacherName,
          language: classDetail.language,
          currentStudent: classDetail.currentStudent,
          classUrl: classDetail.classUrl,
          thumbnail: classDetail.thumbnail,
          followingClassTime: timeString,
          canJoinClass,
        });
      }
    }
    return classes;
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = {
  getCourse,
  getCourseById,
  createPaymentRequest,
  checkCoursePurchased,
  findClass,
  getRegisteredClass,
};
