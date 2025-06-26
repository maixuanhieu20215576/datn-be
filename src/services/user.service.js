const mongoose = require("mongoose");
const _ = require("lodash");
const User = require("../models/user.model");
const ApplicationForm = require("../models/applicationForm.model");
const { constants } = require("../constant");
const Comment = require("../models/comment.model");
const learningProcessModel = require("../models/learningProcess.model");
const orderSessionModel = require("../models/orderSession.model");
const classModel = require("../models/class.model");
const moment = require("moment");
const vietQrBanks = require("../models/vietQr.model");
const Notification = require("../models/notification.model");
const { createNotification } = require("../common/utils");
const Message = require("../models/message.model");
const testResultModel = require("../models/testResult.model");
const testModel = require("../models/test.model");

const getUserInfo = async (userId) => {
  const user = await User.findById(userId);
  return user;
};

const updateUserInfo = async (userId, requestBody, avatar) => {
  const {
    email,
    phoneNumber,
    language,
    facebook,
    linkedin,
    fullName,
    bankAccountNumber,
    bankName,
  } = requestBody;
  let updateUser = { avatar: avatar };
  if (email) {
    updateUser.email = email;
  }
  if (phoneNumber) {
    updateUser.phoneNumber = phoneNumber;
  }
  if (language) {
    updateUser.language = language;
  }
  if (facebook) {
    updateUser.facebook = facebook;
  }
  if (linkedin) {
    updateUser.linkedin = linkedin;
  }
  if (fullName) {
    updateUser.fullName = fullName;
  }
  if (bankAccountNumber && bankName) {
    updateUser.bankPaymentInfo = {
      bankAccountNumber,
      bankName,
    };
  }
  const user = await User.findByIdAndUpdate(userId, updateUser, { new: true });
  return user;
};

const applyTeaching = async (userId, fileUrl, requestBody) => {
  const {
    languageSkills,
    teachingLanguage,
    teachingCommitment,
    bankAccountNumber,
    bankName,
  } = requestBody;
  try {
    const teachingLanguageArray = teachingLanguage
      .split(",")
      .map((lang) => lang.trim())
      .filter((lang) => lang.length > 0);
    /* const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      teachingApplication: {
        languageSkills,
        teachingLanguage: teachingLanguageArray,
        teachingCommitment,
        CV: fileUrl,
        status: constants.applicationStatus.pending,
      },
    },
    { new: true }
  ); */
    const user = await User.findById(userId);
    const fullName = _.get(user, "fullName", "");
    const teachingApplication = await ApplicationForm.create({
      userId,
      languageSkills,
      teachingLanguage: teachingLanguageArray,
      teachingCommitment,
      CV: fileUrl,
      status: constants.applicationStatus.pending,
      fullName,
      bankPaymentInfo: {
        bankName,
        bankAccountNumber,
      },
    });
    await createNotification({
      sourceUserId: userId,
      targetUser: {
        targetUserId: "67c28edae0336995eebf59d9",
        status: constants.notificationStatus.new,
      },
      title: "Có đơn đăng ký giảng dạy mới",
      content: `Người dùng ${fullName} đã đăng ký giảng dạy`,
    });
    return teachingApplication;
  } catch (err) {
    throw new Error(err);
  }
};

const getTeachingApplication = async (userId) => {
  //const user = await User.findById(userId);
  const applicationForm = await ApplicationForm.findOne({
    userId,
  });
  return applicationForm;
};

const postComment = async ({
  userId,
  content,
  rating,
  teacherId,
  teacherProfile,
  classId,
  courseId,
  replyTo,
}) => {
  try {
    if (classId) {
      const appliedClasses = await learningProcessModel.find({
        userId,
        teacherId,
      });
      const teacherClassIds = _.map(
        teacherProfile.teachingClass,
        (item) => item.classId
      );
      const orderSessions = await orderSessionModel.find({
        userId,
        classId: { $in: classId ? [classId] : teacherClassIds },
        status: constants.paymentStatus.success,
      });

      if (appliedClasses.length === 0 && orderSessions.length === 0) {
        throw new Error("Bạn chưa từng tham gia lớp hoc nào của giáo viên này");
      }
      const comment = await Comment.create({
        userId,
        content,
        rating,
        teacherId,
      });

      const commentsOfClass = await Comment.find({
        classId,
      });
      const totalRating = commentsOfClass.reduce(
        (acc, comment) => acc + comment.rating,
        0
      );
      const averageRating = commentsOfClass.length
        ? totalRating / commentsOfClass.length
        : 0;
      await classModel.findByIdAndUpdate(classId, {
        rating: averageRating,
      });
      return comment;
    }
    if (courseId) {
      if (!replyTo) {
        const newComment = await Comment.create({
          userId,
          content,
          courseId,
          isRootComment: true,
        });
        await newComment.populate("userId");

        return newComment;
      } else {
        const newReplyComment = await Comment.create({
          userId,
          content,
          courseId,
          isRootComment: false,
          mentionUserId: replyTo.mentionUserId,
          mentionUserName: replyTo.mentionUserName,
        });

        await Comment.findByIdAndUpdate(
          replyTo.commentId,
          {
            $push: {
              replyComments: newReplyComment._id,
            },
          },
          {
            upsert: true,
          }
        );
        await createNotification({
          content: "Bạn có câu trả lời bình luận mới",
          title: content,
          sourceUserId: userId,
          targetUser: [
            {
              targetUserId: replyTo.mentionUserId,
              status: constants.notificationStatus.new,
            },
          ],
        });
        await newReplyComment.populate("userId");

        return newReplyComment;
      }
    }
    if (teacherId) {
      await Comment.create({
        teacherId,
        userId,
        content,
        rating,
      });
      await createNotification({
        content: "Bạn có bình luận mới",
        title: content,
        sourceUserId: userId,
        targetUser: [
          {
            targetUserId: teacherId,
            status: constants.notificationStatus.new,
          },
        ],
      });
    }
  } catch (err) {
    throw new Error(err);
  }
};

const getCalendar = async (userId) => {
  try {
    const classIds = await orderSessionModel
      .find({ userId })
      .distinct("classId");

    const classes = await classModel
      .find({ _id: { $in: classIds } })
      .populate("schedule.date")
      .lean();

    const calendar = classes.reduce((acc, classItem) => {
      const { schedule, className, _id } = classItem;
      const events = schedule.map((item) => {
        return {
          id: item._id,
          title: className,
          timeText: moment(item.date, "DD/MM/YYYY").format("YYYY-MM-DD"),
          timeFrom: item.timeFrom,
          timeTo: item.timeTo,
          classId: _id,
        };
      });
      return acc.concat(events);
    }, []);

    return calendar;
  } catch (err) {
    throw new Error(err);
  }
};

const attendanceCheck = async (userId, classId) => {
  try {
    const learningProcess = await learningProcessModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      classId,
    });
    if (!learningProcess) {
      const classDetail = await classModel.findById(classId);

      await learningProcessModel.create({
        userId: new mongoose.Types.ObjectId(userId),
        classId,
        teacherId: classDetail.teacherId,
        teacherName: classDetail.teacherName,
        className: classDetail.className,
        attendanceHistory: [],
      });
    }

    const classDetail = await classModel.findById(classId);
    for (const schedule of classDetail.schedule) {
      if (schedule.date === moment(Date.now()).format("DD/MM/YYYY")) {
        const dateMoment = `${schedule.date} ${schedule.timeFrom}`;
        const attendanceHistory = {
          classDate: schedule.date,
          attendanceStatus: moment(dateMoment, "DD/MM/YYYY HH:mm").isBefore(
            moment(Date.now(), "DD/MM/YYYY HH:mm")
          )
            ? constants.attendanceStatus.ontime
            : constants.attendanceStatus.late,
        };
        await learningProcessModel.findOneAndUpdate(
          { userId: new mongoose.Types.ObjectId(userId), classId },
          { $push: { attendanceHistory } }
        );
        return;
      }
    }
  } catch (err) {
    throw new Error(err);
  }
};

const getBankList = async () => {
  try {
    const bankList = await vietQrBanks.find({}).distinct("bankName");
    return bankList;
  } catch (err) {
    throw new Error(err);
  }
};

const getNotification = async ({ userId, page, status }) => {
  try {
    let filter = {
      targetUser: {
        $elemMatch: {
          targetUserId: userId,
        },
      },
    };

    if (status) {
      filter.targetUser.$elemMatch.status = status;
    }
    const notifications = await Notification.find(filter)
      .populate("sourceUserId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * 10)
      .limit(10);

    for (let i = 0; i < notifications.length; ++i) {
      const targetUser = _.find(
        notifications[i].targetUser,
        (item) => item.targetUserId === userId
      );
      const status = _.get(targetUser, "status");
      const notificationObj = notifications[i].toObject();
      notificationObj.status = status;
      notifications[i] = notificationObj;
    }
    return notifications;
  } catch (err) {
    throw new Error(err.message || err);
  }
};

const markAllAsRead = async (requestBody) => {
  try {
    const { notificationIds, userId } = requestBody;
    for (const notificationId of notificationIds) {
      await Notification.updateOne(
        { _id: notificationId, "targetUser.targetUserId": userId },
        { $set: { "targetUser.$.status": constants.notificationStatus.seen } }
      );
    }
  } catch (err) {
    throw new Error(err.message || err);
  }
};

const _getTimeString = (num) => {
  if (num < 60000) return "Vừa xong";
  if (num < 60 * 60000) return `${parseInt(num / 60000)} phút trước`;
  if (num < 24 * 60 * 60000) return `${parseInt(num / (60000 * 60))} giờ trước`;
  return `${parseInt(num / (60000 * 60 * 24))} ngày trước`;
};

const fetchChatHistory = async ({ userId }) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: new mongoose.Types.ObjectId(userId) },
        { receiverId: new mongoose.Types.ObjectId(userId) },
      ],
    })
      .populate("senderId")
      .populate("receiverId")
      .sort({ createdAt: -1 });

    const chats = [];
    const existedUser = [];

    for (const message of messages) {
      if (message.senderId._id.equals(userId)) {
        if (!_.includes(existedUser, String(message.receiverId._id))) {
          chats.push({
            name: message.receiverId.fullName,
            avatar: message.receiverId.avatar,
            time: _getTimeString(Date.now() - message.createdAt.getTime()),
            opponentId: _.toString(message.receiverId._id),
          });
          existedUser.push(String(message.receiverId._id));
        }
      } else {
        if (!_.includes(existedUser, String(message.senderId._id))) {
          chats.push({
            name:
              message.senderId.role === "admin"
                ? "Quản trị viên"
                : message.senderId.fullName,
            avatar: message.senderId.avatar,
            time: _getTimeString(Date.now() - message.createdAt.getTime()),
            opponentId: _.toString(message.senderId._id),
          });
          existedUser.push(String(message.senderId._id));
        }
      }
    }
    return chats;
  } catch (err) {
    throw new Error(err);
  }
};

const loadMessageHistory = async ({ userId, opponentId }) => {
  try {
    const messages = await Message.find({
      $or: [
        {
          senderId: new mongoose.Types.ObjectId(userId),
          receiverId: new mongoose.Types.ObjectId(opponentId),
        },
        {
          receiverId: new mongoose.Types.ObjectId(userId),
          senderId: new mongoose.Types.ObjectId(opponentId),
        },
      ],
    }).sort({ createdAt: 1 });
    return messages;
  } catch (err) {
    throw new Error(err);
  }
};

const getClassHistory = async ({ userId, classId }) => {
  try {
    let classHistory = {};
    const learningProcess = await learningProcessModel
      .findOne({
        userId,
        classId,
      })
      .populate("attendanceHistory");
    if (!learningProcess) {
      throw new Error("Không tìm thấy lịch sử lớp học");
    }

    const classDetail = await classModel.findById(classId);
    const heldClasses = classDetail.schedule.filter((item) =>
      moment(item.date, "DD/MM/YYYY").isBefore(moment(), "day")
    );
    classHistory.totalSessions = _.size(heldClasses);
    classHistory.attendedSessions = learningProcess
      ? _.size(learningProcess.attendanceHistory)
      : 0;

    const tests = await testModel.find({ classId });

    const testIds = _.map(tests, (test) => test._id);
    const testResult = await testResultModel
      .find({
        userId,
        testId: { $in: testIds },
      })
      .populate("testId")
      .select("grade testId _id createdAt");

    classHistory.testResults = testResult.map((item) => ({
      id: item._id,
      score: item.grade,
      testId: item.testId._id,
      name: item.testId.name,
      date: moment(item.createdAt).format("HH:mm DD/MM/YYYY"),
      maxScore: item.testId.maxGrade,
    }));
    return classHistory;
  } catch (err) {
    throw new Error(err);
  }
};
module.exports = {
  getUserInfo,
  updateUserInfo,
  applyTeaching,
  getTeachingApplication,
  postComment,
  getCalendar,
  attendanceCheck,
  getBankList,
  getNotification,
  markAllAsRead,
  fetchChatHistory,
  loadMessageHistory,
  getClassHistory,
};
