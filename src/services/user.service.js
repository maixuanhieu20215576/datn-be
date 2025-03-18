const _ = require("lodash");
const User = require("../models/user.model");
const ApplicationForm = require("../models/applicationForm.model");
const { constants } = require("../constant");

const getUserInfo = async (userId) => {
  const user = await User.findById(userId);
  return user;
};

const updateUserInfo = async (userId, requestBody, avatar) => {
  const { email, phoneNumber, language, facebook, linkedin, fullName } =
    requestBody;
  const user = await User.findByIdAndUpdate(
    userId,
    {
      email,
      phoneNumber,
      avatar,
      language,
      facebook,
      linkedin,
      fullName,
    },
    { new: true }
  );
  return user;
};

const applyTeaching = async (userId, fileUrl, requestBody) => {
  const { languageSkills, teachingLanguage, teachingCommitment } = requestBody;
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
  });

  // const teachingApplication = _.get(updatedUser, "teachingApplication");
  return teachingApplication;
};

const getTeachingApplication = async (userId) => {
  //const user = await User.findById(userId);
  const applicationForm = await ApplicationForm.findOne({
    userId,
  });
  return applicationForm;
};

module.exports = {
  getUserInfo,
  updateUserInfo,
  applyTeaching,
  getTeachingApplication,
};
