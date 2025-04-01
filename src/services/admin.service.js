const moment = require("moment");
const _ = require("lodash");
const { constants } = require("../constant");
const ApplicationForm = require("../models/applicationForm.model");
const User = require("../models/user.model");
const Class = require("../models/class.model");
const { removeVietnameseTone } = require("../common/utils");
const orderSessionModel = require("../models/orderSession.model");

const fetchApplicationForms = async ({
  page,
  itemPerPage,
  filterStatus,
  userId,
}) => {
  let filter = {};
  if (filterStatus !== constants.applicationStatus.all) {
    filter = { status: filterStatus };
  }
  if (userId) {
    filter = { ...filter, userId: userId };
  }

  const applicationForms = await ApplicationForm.find(filter)
    .sort({ createdAt: -1 }) // -1: Giảm dần (mới nhất trước), 1: Tăng dần (cũ nhất trước)
    .skip((page - 1) * itemPerPage)
    .limit(itemPerPage);

  return applicationForms;
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
  const stringForSearch = getStringForSeach({
    className,
    teacherName,
    language: teachingLanguage,
  });
  try {
    if (classType === constants.classType.singleClass) {
      await Class.create({
        className,
        teacherId,
        teacherName,
        maxStudent: maxStudent || 0,
        classUrl,
        language: teachingLanguage,
        price,
        priceType,
        schedule: [{ date: schedule, timeFrom, timeTo }],
        classType: constants.classType.singleClass,
        thumbnail,
        stringForSearch,
      });
    }

    if (classType === constants.classType.classByWeeks) {
      let scheduleForClassByWeeks = [];

      for (const scheduleItem of schedule) {
        const matchedDates = getMatchingWeekDays({
          startStr: startDayForClassByWeeks,
          endStr: endDayForClassByWeeks,
          dayOfWeekStr: scheduleItem.dateOfWeek,
          timeFrom: scheduleItem.timeFrom,
          timeTo: scheduleItem.timeTo,
        });

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
      studentInfo.push({
        studentName: orderSession.username,
        email: orderSession.email,
        phoneNumber: orderSession.phoneNumber,
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

    // Trả về dữ liệu sau khi cập nhật
    return updatedClass;
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
};
