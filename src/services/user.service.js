const _ = require("lodash");
const User = require("../models/user.model");
const { constants } = require("../constant"); // Import constants

const getUserInfo = async (userId) => {
  const user = await User.findById(userId);
  return user;
};

const updateUserInfo = async (userId, requestBody, avatar) => {
  const { email, name, username, phoneNumber, language } = requestBody;
  const user = await User.findByIdAndUpdate(
    userId,
    {
      email,
      name,
      username,
      phoneNumber,
      avatar,
      language,
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
  const updatedUser = await User.findByIdAndUpdate(
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
  );

  const teachingApplication = _.get(updatedUser, "teachingApplication");
  return teachingApplication;
};

const getTeachingApplication = async (userId) => {
  const user = await User.findById(userId);
  const teachingApplication = _.get(user, "teachingApplication");
  return teachingApplication;
};
module.exports = {
  getUserInfo,
  updateUserInfo,
  applyTeaching,
  getTeachingApplication,
};
