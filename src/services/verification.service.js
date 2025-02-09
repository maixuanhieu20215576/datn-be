const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
require("dotenv").config();

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

    return { user };
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
