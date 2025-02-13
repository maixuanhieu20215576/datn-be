const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const User = require("../models/user.model");
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

const register = async ({ username, password }) => {
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      throw new Error("Username already taken");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });

    await newUser.save();

    return { user: newUser };
  } catch (error) {
    throw new Error(error.message);
  }
};
module.exports = { login, register };
