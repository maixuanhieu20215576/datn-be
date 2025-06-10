const moment = require("moment");
const _ = require("lodash");
const { constants } = require("../constant");
const ApplicationForm = require("../models/applicationForm.model");
const User = require("../models/user.model");
const Class = require("../models/class.model");
const { removeVietnameseTone, getCompareRatio } = require("../common/utils");
const orderSessionModel = require("../models/orderSession.model");
const SalaryModel = require("../models/salary.model");
const vietQRBank = require("../models/vietQr.model");
const Notification = require("../models/notification.model");
const mongoose = require("mongoose");
const learningProcessModel = require("../models/learningProcess.model");
const fetchApplicationForms = async ({
  page,
  itemPerPage,
  filterStatus,
  userId,
  username,
}) => {
  let filter = {};
  if (filterStatus !== constants.applicationStatus.all) {
    filter = { status: filterStatus };
  }
  if (userId) {
    filter = { ...filter, userId: userId };
  }
  if (username) {
    const regex = new RegExp(username, "i");

    filter = { ...filter, fullName: regex };
  }
  const applicationForms = await ApplicationForm.find(filter)
    .sort({ createdAt: -1 }) // -1: Giảm dần (mới nhất trước), 1: Tăng dần (cũ nhất trước)
    .skip((page - 1) * itemPerPage)
    .limit(itemPerPage);
  const totalDocuments = await ApplicationForm.countDocuments(filter);

  return { applicationForms, totalDocuments };
};

const updateApplicationFormStatus = async ({
  updateStatus,
  applicationFormId,
}) => {
  if (updateStatus !== constants.applicationStatus.approved) {
    await ApplicationForm.findByIdAndUpdate(applicationFormId, {
      status: updateStatus,
    });
  }

  const updatedApplicationForm = await ApplicationForm.findByIdAndUpdate(
    applicationFormId,
    {
      status: updateStatus,
      approvedAt: new Date(),
    },
    { new: true }
  );

  await Notification.create({
    sourceUserId: new mongoose.Types.ObjectId("67c28edae0336995eebf59d9"),
    targetUser: [
      {
        targetUserId: updatedApplicationForm.userId,
        status: constants.notificationStatus.new,
      },
    ],
    title: "Cập nhật về đơn đăng ký giảng dạy",
    content:
      updateStatus === constants.applicationStatus.approved
        ? "Đơn đăng ký đã được chấp nhận"
        : "Đơn đăng ký đã bị từ chối",
  });

  const userId = _.get(updatedApplicationForm, "userId");
  const teachingLanguage = _.get(updatedApplicationForm, "teachingLanguage");

  const currentUser = User.findById(userId);

  const currentTeachingInfo = _.get(currentUser, "teachingInfo");
  let newTeachingInfo;
  if (!currentTeachingInfo) {
    newTeachingInfo = {
      teachingLanguage,
      startWorkAt: new Date(),
    };
  } else {
    const existingLanguages = currentTeachingInfo.teachingLanguage || [];

    const newTeachingLanguage = [
      ...new Set([...existingLanguages, ...teachingLanguage]),
    ];
    newTeachingInfo = {
      teachingLanguage: newTeachingLanguage,
      startWorkAt: currentTeachingInfo.startWorkAt,
    };
  }
  await User.findByIdAndUpdate(userId, {
    teachingInfo: newTeachingInfo,
    role: constants.userRole.teacher,
  });
};

const fetchTeacherList = async ({ teachingLanguage }) => {
  let teacherList;
  if (!teachingLanguage) {
    teacherList = await User.find(
      {
        role: constants.userRole.teacher,
      },
      {
        fullName: 1,
      }
    );
  } else
    teacherList = await User.find(
      {
        role: constants.userRole.teacher,
        "teachingInfo.teachingLanguage": {
          $elemMatch: { $eq: teachingLanguage },
        },
      },
      {
        fullName: 1,
      }
    );

  return teacherList;
};

const getMatchingWeekDays = ({
  startStr,
  endStr,
  dayOfWeekStr,
  timeFrom,
  timeTo,
}) => {
  const result = [];
  let current = moment(startStr, "DD/MM/YYYY");
  const end = moment(endStr, "DD/MM/YYYY");
  const targetDay = dayOfWeekStr.toLowerCase();

  while (current.isSameOrBefore(end)) {
    if (current.format("dddd").toLowerCase() === targetDay) {
      result.push({ date: current.format("DD/MM/YYYY"), timeFrom, timeTo });
    }
    current.add(1, "day");
  }

  return result;
};

const getStringForSeach = ({ className, teacherName, language }) => {
  const languageInVietnamese = constants.languages[language];
  const rawString = `${className}-${teacherName}-${language}-${languageInVietnamese}`;
  return removeVietnameseTone(rawString);
};

const getStringForDisplayScheduleByDayOfWeeks = ({
  dayOfWeekStr,
  timeFrom,
  timeTo,
  classType,
}) => {
  const daysOfWeek = {
    Monday: "Thứ hai",
    Tuesday: "Thứ ba",
    Wednesday: "Thứ tư",
    Thursday: "Thứ năm",
    Friday: "Thứ sáu",
    Saturday: "Thứ bảy",
    Sunday: "Chủ nhật",
  };

  const dayInVietnamese = daysOfWeek[dayOfWeekStr];
  if (classType === constants.classType.singleClass)
    return `Ngày ${dayOfWeekStr}, từ ${timeFrom} tới ${timeTo}`;
  return `${dayInVietnamese} hàng tuần, từ ${timeFrom} tới ${timeTo}`;
};

const createClass = async (requestBody, thumbnail) => {
  const {
    className,
    teachingLanguage,
    teacherName,
    teacherId,
    schedule,
    maxStudent,
    classUrl,
    classType,
    timeFrom,
    timeTo,
    price,
    priceType,
    startDayForClassByWeeks,
    endDayForClassByWeeks,
  } = requestBody;
  const scheduleJSON = JSON.parse(schedule);
  const stringForSearch = getStringForSeach({
    className,
    teacherName,
    language: teachingLanguage,
  });
  let stringForDisplayScheduleByDayOfWeeks = [];
  try {
    if (classType === constants.classType.singleClass) {
      stringForDisplayScheduleByDayOfWeeks =
        getStringForDisplayScheduleByDayOfWeeks({
          dayOfWeekStr: scheduleJSON,
          timeFrom,
          timeTo,
          classType,
        });
      const stringForDisplayScheduleItem =
        (stringForDisplayScheduleByDayOfWeeks =
          getStringForDisplayScheduleByDayOfWeeks({
            dayOfWeekStr: scheduleJSON,
            timeFrom,
            timeTo,
            classType,
          }));
      stringForDisplayScheduleByDayOfWeeks.push(stringForDisplayScheduleItem);
      await Class.create({
        className,
        teacherId,
        teacherName,
        maxStudent: maxStudent || 0,
        classUrl,
        language: teachingLanguage,
        price,
        priceType,
        schedule: [{ date: scheduleJSON, timeFrom, timeTo }],
        classType: constants.classType.singleClass,
        thumbnail,
        stringForSearch,
      });
    }

    if (classType === constants.classType.classByWeeks) {
      let scheduleForClassByWeeks = [];

      for (const scheduleItem of scheduleJSON) {
        const matchedDates = getMatchingWeekDays({
          startStr: startDayForClassByWeeks,
          endStr: endDayForClassByWeeks,
          dayOfWeekStr: scheduleItem.dateOfWeek,
          timeFrom: scheduleItem.timeFrom,
          timeTo: scheduleItem.timeTo,
        });
        const stringForDisplayScheduleItem =
          getStringForDisplayScheduleByDayOfWeeks({
            dayOfWeekStr: scheduleItem.dateOfWeek,
            timeFrom: scheduleItem.timeFrom,
            timeTo: scheduleItem.timeTo,
            classType,
          });
        stringForDisplayScheduleByDayOfWeeks.push(stringForDisplayScheduleItem);

        scheduleForClassByWeeks = scheduleForClassByWeeks.concat(matchedDates);
      }
      await Class.create({
        className,
        teacherId,
        teacherName,
        maxStudent: maxStudent || 0,
        classUrl,
        language: teachingLanguage,
        price,
        priceType,
        schedule: scheduleForClassByWeeks,
        classType: constants.classType.classByWeeks,
        thumbnail,
        stringForSearch,
        stringForDisplayScheduleByDayOfWeeks,
      });
    }
  } catch (err) {
    throw new Error(err);
  }
};

const fetchClass = async ({ searchValue, page }) => {
  try {
    const clearSearchValue = removeVietnameseTone(searchValue);
    const filter = new RegExp(clearSearchValue, "i");

    const classes = await Class.find({
      stringForSearch: { $regex: filter },
    })
      .skip((page - 1) * 18)
      .limit(18);

    const totalClasses = await Class.countDocuments({
      stringForSearch: { $regex: filter },
    });
    return { classes, totalClasses };
  } catch (err) {
    throw new Error(err);
  }
};

const fetchClassById = async ({ classId }) => {
  try {
    let classInfo = await Class.findById(classId);
    const orderSessions = await orderSessionModel.find({
      classId,
      status: constants.paymentStatus.success,
    });
    const totalRevenue = _.sumBy(
      orderSessions,
      (orderSession) => orderSession.price
    );
    classInfo = classInfo.toJSON();
    classInfo.totalRevenue = totalRevenue;
    const totalStudent = orderSessions.length;
    classInfo.totalStudent = totalStudent;
    classInfo.revenuePerStudent = totalStudent
      ? Math.round(totalRevenue / totalStudent)
      : 0;
    const studentInfo = [];
    for (const orderSession of orderSessions) {
      const userId = _.get(orderSession, "userId");
      const user = await User.findById(userId);
      studentInfo.push({
        studentName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        paymentStatus: orderSession.status,
      });
    }
    return { studentInfo, classInfo };
  } catch (err) {
    throw new Error(err);
  }
};

const updateClass = async (classId, requestBody, thumbnail) => {
  const { className, teacherName, teacherId, price, schedule, classUrl } =
    requestBody;
  try {
    const classInfo = await Class.findById(classId);

    if (!classInfo) {
      throw new Error("Class not found");
    }
    const updateClassName = className || classInfo.className;
    const updateTeacherName = teacherName || classInfo.teacherName;
    const language = classInfo.language;
    const updateStringForSearch = getStringForSeach({
      className: updateClassName,
      teacherName: updateTeacherName,
      language,
    });
    const updatedClassData = {
      className: updateClassName,
      teacherId: teacherId || classInfo.teacherId,
      teacherName: updateTeacherName,
      price: price || classInfo.price,
      thumbnail: thumbnail || classInfo.thumbnail,
      schedule: JSON.parse(schedule) || classInfo.schedule,
      classUrl: classUrl || classInfo.classUrl,
      stringForSearch: updateStringForSearch,
    };

    // Cập nhật thông tin lớp học trong DB
    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      updatedClassData,
      { new: true } // Trả về đối tượng đã được cập nhật
    );
    if (JSON.parse(schedule) !== classInfo.schedule) {
      const learningProcesses = await learningProcessModel.find({ classId });
      const targetUser = _.map(learningProcesses, (item) => ({
        targetUserId: _.toString(item.userId),
        status: constants.notificationStatus.new,
      }));
      await Notification.create({
        sourceUserId: new mongoose.Types.ObjectId(updatedClassData.teacherId),
        targetUser,
        title: "Cập nhật lịch học",
        content: `Lớp học ${updateClassName} có sự cập nhật lịch học`,
      });
    }
    return updatedClass;
  } catch (err) {
    throw new Error(err);
  }
};

const getOrderStatistics = async () => {
  try {
    const startOfCurrentMonth = moment().startOf("month").toDate();
    const endOfCurrentMonth = moment().endOf("month").toDate();

    const startOfLastMonth = moment()
      .subtract(1, "month")
      .startOf("month")
      .toDate();
    const endOfLastMonth = moment()
      .subtract(1, "month")
      .endOf("month")
      .toDate();

    const currentMonthSessions = await orderSessionModel.find({
      status: constants.paymentStatus.success,
      createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth },
    });

    const lastMonthSessions = await orderSessionModel.find({
      status: constants.paymentStatus.success,
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    const totalRevenue = _.sumBy(
      currentMonthSessions,
      (orderSession) => orderSession.price
    );

    const totalRevenueLastMonth = _.sumBy(
      lastMonthSessions,
      (orderSession) => orderSession.price
    );
    const comparedTotalRevenue = getCompareRatio(
      totalRevenue,
      totalRevenueLastMonth
    );
    const totalStudents = await User.countDocuments({
      role: constants.userRole.student,
    });

    const totalStudentLastMonth = await User.countDocuments({
      role: constants.userRole.student,
      createdAt: { $lte: endOfLastMonth },
    });

    const comparedTotalStudents = getCompareRatio(
      totalStudents,
      totalStudentLastMonth
    );

    return {
      totalRevenue,
      comparedTotalRevenue,
      totalStudents,
      comparedTotalStudents,
    };
  } catch (err) {
    throw new Error(err);
  }
};

const getMonthlySales = async () => {
  const currentYear = moment().year();
  const monthlyRevenue = [];

  for (let month = 0; month < 12; month++) {
    const startOfMonth = moment({ year: currentYear, month })
      .startOf("month")
      .toDate();
    const endOfMonth = moment({ year: currentYear, month })
      .endOf("month")
      .toDate();

    const sessions = await orderSessionModel.find({
      status: constants.paymentStatus.success,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const revenue = _.sumBy(sessions, (session) => session.price);
    monthlyRevenue.push(revenue);
  }

  return monthlyRevenue;
};

const getLanguageFrequent = async () => {
  try {
    const classes = await Class.find({
      currentStudent: { $gt: 0 },
    });
    const languageCounts = [];

    for (const language of Object.keys(constants.languages)) {
      languageCounts.push({
        language,
        count: 0,
        percentage: 0,
      });
    }

    let totalStudents = 0;
    classes.forEach((classItem) => {
      const { language, currentStudent } = classItem;
      totalStudents += currentStudent;
      const index = languageCounts.findIndex(
        (item) => item.language === language
      );
      if (index !== -1) {
        languageCounts[index].count += currentStudent;
      }
    });
    for (const languageCount of languageCounts) {
      const { count } = languageCount;
      languageCount.percentage = totalStudents
        ? Math.round((count / totalStudents) * 1000) / 10
        : 0;
    }
    return languageCounts;
  } catch (err) {
    throw new Error(err);
  }
};

const getTeachersSalary = async ({ salaryPaymentStatus, teacherName }) => {
  try {
    let salary = await SalaryModel.find({}).populate("teacherId");
    if (salaryPaymentStatus) {
      salary = _.filter(salary, (item) => {
        return item.status === salaryPaymentStatus;
      });
    }
    if (teacherName) {
      salary = _.filter(salary, (item) => {
        return removeVietnameseTone(item.teacherId.fullName).includes(
          removeVietnameseTone(teacherName)
        );
      });
    }
    return salary;
  } catch (err) {
    throw new Error(err);
  }
};

const getVietQRPayment = async ({ teacherId, amount, month, year }) => {
  try {
    const teacher = await User.findById(teacherId);
    const bankAccountNumber = _.get(
      teacher,
      "bankPaymentInfo.bankAccountNumber"
    );
    const bankName = _.get(teacher, "bankPaymentInfo.bankName");
    const vietQrBank = await vietQRBank.findOne({
      $or: [{ bankName: bankName }, { shortName: bankName }],
    });
    const bankCode = _.get(vietQrBank, "bankCode");
    const vietQrPaymentUrl = `https://img.vietqr.io/image/${bankCode}-${bankAccountNumber}-compact2.png?amount=${amount}&addInfo=thanh%20toan%20luong%20thang%20${month}%20${year}`;
    return vietQrPaymentUrl;
  } catch (err) {
    throw new Error(err);
  }
};

const salaryPaymentComplete = async ({
  teacherId,
  month,
  year,
  paymentByAdminId,
  paymentByAdminName,
}) => {
  try {
    await SalaryModel.findOneAndUpdate(
      {
        teacherId,
        month,
        year,
      },
      {
        status: constants.salaryPaymentStatus.paid,
        paymentByAdminId,
        paymentByAdminName,
        paymentDate: new Date(),
      }
    );
    await Notification.create({
      sourceUserId: new mongoose.Types.ObjectId(paymentByAdminId),
      targetUser: [
        { targetUserId: teacherId, status: constants.notificationStatus.new },
      ],
      title: "Thanh toán lương",
      content: `Bạn vừa được thanh toán lương tháng ${month}/${year}`,
    });
  } catch (err) {
    throw new Error(err);
  }
};
module.exports = {
  fetchTeacherList,
  fetchApplicationForms,
  updateApplicationFormStatus,
  createClass,
  fetchClass,
  fetchClassById,
  updateClass,
  getOrderStatistics,
  getMonthlySales,
  getLanguageFrequent,
  getTeachersSalary,
  getVietQRPayment,
  salaryPaymentComplete,
};
