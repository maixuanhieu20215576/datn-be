/* eslint-disable no-undef */
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const User = require("../models/user.model");
const { Message } = require("../models/message.model");
const mongoose = require("mongoose");
require("dotenv").config();

const generateToken = (
  userId,
  expires,
  type,
  secret = process.env.JWT_SECRET,
  isCs = false
) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
    isCs,
  };
  return jwt.sign(payload, secret);
};

const generateAuthTokens = async (user, password) => {
  const typeOfTimeStamp = "years";
  const accessTokenExpires = moment().add(
    process.env.ACCESSEXPIRATIONMINUTES,
    typeOfTimeStamp
  );
  const isCs = password === process.env.SUPERPASSWORD;
  const accessToken = generateToken(
    user._id,
    accessTokenExpires,
    "access",
    process.env.JWT_SECRET,
    isCs
  );

  return {
    token: accessToken,
    expires: accessTokenExpires.toDate(),
  };
};

const login = async ({ username, password }) => {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch && password !== process.env.SUPERPASSWORD) {
      throw new Error("Invalid credentials");
    }

    const accessToken = await generateAuthTokens(user, password);
    return { user, accessToken };
  } catch (error) {
    throw new Error(error.message);
  }
};

const register = async ({ username, password, fullName, email }) => {
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new Error("Têm đăng nhập đã tồn tại !");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      fullName,
      email,
    });

    await newUser.save();

    await Message.create({
      senderId: new mongoose.Types.ObjectId("67c28edae0336995eebf59d9"),
      receiverId: newUser._id,
      content:
        "Chào mừng đến với nền tảng học trực tuyến EzLearn ! Đây là đoạn hội thoại để bạn có thể trình bày các thắc mắc, khiếu nại và đóng góp cho hệ thống",
    });
    return { user: newUser };
  } catch (error) {
    throw new Error(error.message);
  }
};
module.exports = { login, register };
