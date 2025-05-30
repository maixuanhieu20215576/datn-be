/* eslint-disable no-undef */
const jwt = require("jsonwebtoken");
const moment = require("moment");
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

module.exports = {
  generateToken,
  generateAuthTokens,
};