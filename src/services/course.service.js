const moment = require("moment");
const _ = require("lodash");
const TestResult = require("../models/testResult.model");
const TestModel = require("../models/test.model");
const Course = require("../models/course.model");
const Class = require("../models/class.model");
const OrderSession = require("../models/orderSession.model");
const { constants } = require("../constant");
const classModel = require("../models/class.model");
const learningProcessModel = require("../models/learningProcess.model");
const Comment = require("../models/comment.model");
const mongoose = require("mongoose");
const _convertTimeToMilisecond = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours * 60 + minutes) * 60 * 1000;
};
const { uploadFileToS3, createNotification } = require("../common/utils");
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
    ).sort({ createdAt: -1 });
    const classes = [];
    for (const orderSession of orderSessions) {
      const classId = _.get(orderSession, "classId");
      if (classId) {
        const classDetail = await classModel.findById(classId);
        let timeString;
        let canJoinClass = false;
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
            canJoinClass || followingClassTimeInMiliseconds < 15 * 60 * 1000;

          const duration = moment.duration(followingClassTimeInMiliseconds);
          const days = Math.floor(duration.asDays());
          const hours = duration.hours();
          const minutes = duration.minutes();

          timeString = `${days} ngày ${hours} giờ ${minutes} phút`;
          break;
        }

        let incomingTest = await TestModel.findOne({
          classId: classDetail._id,
        })
          .select("name _id examDate examTime")
          .lean();
        let testResult = null;
        if (incomingTest) {
          testResult = await TestResult.findOne({
            userId,
            testId: incomingTest._id,
          });
          incomingTest = { ...incomingTest, isDoneTest: !!testResult };
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
          incomingTest: incomingTest || "",
        });
      }
    }

    return classes;
  } catch (err) {
    throw new Error(err);
  }
};

const getCourseUnit = async ({ courseId, userId }) => {
  try {
    const courseDetail = await Course.findById(courseId);
    const courseLearningProcess = await learningProcessModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      courseId,
    });

    const learningProcess = _.get(
      courseLearningProcess,
      "courseLearningProcess",
      []
    );
    return { courseDetail, learningProcess };
  } catch (err) {
    throw new Error(err);
  }
};

const _getUnitLearningStatus = (learningProcess, unitId) => {
  if (_.isEmpty(_.get(learningProcess, "courseLearningProcess", [])))
    return constants.courseLearningProcessStatus.undone;

  for (const unitLearningProcess of learningProcess.courseLearningProcess) {
    if (unitLearningProcess.unitId === unitId)
      return unitLearningProcess.status;
  }
  return constants.courseLearningProcessStatus.undone;
};

const getUnitContent = async ({ courseId, lectureId, userId }) => {
  try {
    const courseDetail = await Course.findById(courseId);
    if (!courseDetail) {
      throw new Error("Course not found");
    }
    for (
      let lectureIndex = 0;
      lectureIndex < courseDetail.lectures.length;
      lectureIndex++
    ) {
      const lecture = courseDetail.lectures[lectureIndex];

      for (let unitIndex = 0; unitIndex < lecture.units.length; unitIndex++) {
        let unitContent = lecture.units[unitIndex];

        if (_.toString(unitContent._id) === lectureId) {
          const unitContentObj =
            typeof unitContent.toObject === "function"
              ? unitContent.toObject()
              : unitContent;
          if (_.includes(unitContentObj.fileUrl, "pdf")) {
            unitContentObj.lectureType = "pdf";
          }
          if (_.includes(unitContentObj.fileUrl, "mp4")) {
            unitContentObj.lectureType = "mp4";
          }

          let nextLectureId = "";
          if (unitIndex + 1 < lecture.units.length) {
            nextLectureId = _.toString(lecture.units[unitIndex + 1]._id);
          } else if (lectureIndex + 1 < courseDetail.lectures.length) {
            const nextLecture = courseDetail.lectures[lectureIndex + 1];
            if (nextLecture.units.length > 0) {
              nextLectureId = _.toString(nextLecture.units[0]._id);
            }
          }

          let lastLectureId = "";
          if (unitIndex - 1 >= 0) {
            lastLectureId = _.toString(lecture.units[unitIndex - 1]._id);
          } else if (lectureIndex - 1 >= 0) {
            const prevLecture = courseDetail.lectures[lectureIndex - 1];
            if (prevLecture.units.length > 0) {
              lastLectureId = _.toString(
                prevLecture.units[prevLecture.units.length - 1]._id
              );
            }
          }
          const learningProcess = await learningProcessModel.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            courseId,
          });

          const status = _getUnitLearningStatus(learningProcess, lectureId);
          return {
            lectureContent: unitContentObj,
            parentUnit: lecture.name,
            courseName: courseDetail.course_name,
            nextLectureId: nextLectureId,
            lastLectureId: lastLectureId,
            status,
          };
        }
      }
    }

    return null; // Không tìm thấy lectureId
  } catch (err) {
    throw new Error(err.stack || "Something went wrong");
  }
};

const createCourse = async (req) => {
  try {
    const {
      courseName,
      instructor,
      originalPrice,
      discountedPrice,
      language,
      lectures: lecturesRaw,
    } = req.body;

    const files = req.files || [];

    const thumbnailFile = files.find((file) => file.fieldname === "thumbnail");
    let thumbnailUrl = null;
    if (thumbnailFile) {
      thumbnailUrl = await uploadFileToS3(thumbnailFile);
    }

    const lectures = JSON.parse(lecturesRaw);

    for (let i = 0; i < lectures.length; i++) {
      const lecture = lectures[i];
      for (let j = 0; j < lecture.units.length; j++) {
        const unit = lecture.units[j];
        const fileFieldName = unit.fileFieldName;

        const matchedFile = files.find((f) => f.fieldname === fileFieldName);

        if (matchedFile) {
          const fileUrl = await uploadFileToS3(matchedFile);
          unit.fileUrl = fileUrl;
        } else {
          unit.fileUrl = null;
        }

        delete unit.fileFieldName; // xóa key tạm
      }
    }

    const newCourse = await Course.create({
      course_name: courseName,
      course_instr: instructor,
      price: originalPrice,
      price_dis: discountedPrice,
      language,
      thumbnail: thumbnailUrl,
      lectures,
    });
    return newCourse;
  } catch (err) {
    throw new Error(err);
  }
};

const updateCourseLearningProcessStatus = async ({
  userId,
  courseId,
  unitId,
  status,
}) => {
  try {
    await learningProcessModel.updateOne(
      { userId: new mongoose.Types.ObjectId(userId), courseId },
      {
        $push: {
          courseLearningProcess: { unitId, status },
        },
      },
      { upsert: true }
    );
  } catch (err) {
    throw new Error(err);
  }
};

const getCourseDiscussion = async ({ courseId, page = 1, itemPerPage = 5 }) => {
  try {
    const result = await Comment.paginate(
      { courseId, isRootComment: true }, // chỉ lấy comment gốc
      {
        page,
        limit: itemPerPage,
        sort: { createdAt: -1 },
        populate: [
          {
            path: "userId",
            select: "fullName avatar",
          },
          {
            path: "replyComments",
            populate: {
              path: "userId",
              select: "fullName avatar",
            },
          },
        ],
        lean: true,
      }
    );
    return {
      success: true,
      comments: result.docs,
      totalPages: result.totalPages,
      totalItems: result.totalDocs,
      currentPage: result.page,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

const commentVote = async ({ commentId, type }) => {
  try {
    const comment = await Comment.findById(commentId).populate("userId");
    if (type === constants.commentVoteType.upvote) {
      await Comment.updateOne({ _id: commentId }, { $inc: { upvotes: 1 } });
      await createNotification({
        content: "Bình luận của bạn có lượt thích mới",
        title: "",
        targetUser: [
          {
            targetUserId: comment.userId._id,
            status: constants.notificationStatus.new,
          },
        ],
      });
    }
    if (type === constants.commentVoteType.downvote) {
      await Comment.updateOne({ _id: commentId }, { $inc: { downvotes: 1 } });
      await createNotification({
        content: "Bình luận của bạn có lượt dislike",
        title: "",
        targetUser: [
          {
            targetUserId: comment.userId._id,
            status: constants.notificationStatus.new,
          },
        ],
      });
    }
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getCourse,
  getCourseById,
  createPaymentRequest,
  checkCoursePurchased,
  findClass,
  getRegisteredClass,
  getCourseUnit,
  getUnitContent,
  createCourse,
  updateCourseLearningProcessStatus,
  getCourseDiscussion,
  commentVote,
};
