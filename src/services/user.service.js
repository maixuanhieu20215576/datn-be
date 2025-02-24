const User = require("../models/user.model");

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

module.exports = { getUserInfo, updateUserInfo };
