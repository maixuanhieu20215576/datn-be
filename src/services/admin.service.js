const moment = require("moment");
const _ = require("lodash");
const { constants } = require("../constant");
const ApplicationForm = require("../models/applicationForm.model");
const User = require("../models/user.model");
const Class = require("../models/class.model");

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

const createClass = async (requestBody) => {
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
  try {
    if (classType === constants.classType.singleClass) {
      await Class.create({
        className,
        teacherId,
        teacherName,
        maxStudent: maxStudent || 10000,
        classUrl,
        language: teachingLanguage,
        price,
        priceType,
        schedule: [{ date: schedule, timeFrom, timeTo }],
        classType: constants.classType.singleClass,
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
        maxStudent: maxStudent || 10000,
        classUrl,
        language: teachingLanguage,
        price,
        priceType,
        schedule: scheduleForClassByWeeks,
        classType: constants.classType.classByWeeks,
      });
    }
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = {
  fetchTeacherList,
  fetchApplicationForms,
  updateApplicationFormStatus,
  createClass,
};
