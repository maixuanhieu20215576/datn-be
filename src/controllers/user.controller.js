/* eslint-disable no-undef */
require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const userService = require("../services/user.service");
const FormData = require("form-data");

const _getAccessToken = async () => {
  const response = await axios.post(
    "https://api.imgur.com/oauth2/token",
    new URLSearchParams({
      client_id: process.env.IMGUR_CLIENT_ID,
      client_secret: process.env.IMGUR_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: process.env.IMGUR_REFRESH_TOKEN,
    }).toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );
  
  return response.data.access_token;
};

const getUserInfo = async (req, res) => {
  try {
    const userId = req.userId;
    const userInfomation = await userService.getUserInfo(userId);
    res.status(200).json(userInfomation);
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateUserInfo = async (req, res) => {
  try {
    const accessToken = await _getAccessToken();
    const userId = req.headers["userid"] || req.body.userId;
    if (!userId) {
      res.status(500).json({
        message: "Lỗi khi cập nhật thông tin người dùng",
      });
    }
    let avatar;

    if (req.file) {
      const imageFilePath = req.file.path;

      const imageData = fs.readFileSync(imageFilePath);

      const form = new FormData();
      form.append("image", imageData.toString("base64"));
      const response = await axios.post("https://api.imgur.com/3/image", form, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...form.getHeaders(),
        },
        timeout: 10000,
      });

      fs.unlinkSync(imageFilePath);
      avatar = response.data.data.link;
    } else {
      // Nếu không có file, sử dụng trực tiếp text được gửi
      avatar = req.body.avatar;
    }

    await userService.updateUserInfo(userId, req.body, avatar);

    res.status(200).json({
      message: "Cập nhật thông tin người dùng thành công",
      avatarUrl: avatar,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi cập nhật thông tin người dùng",
      error: err.response ? err.response.data : err.message,
    });
  }
};

module.exports = {
  getUserInfo,
  updateUserInfo,
};
