/* eslint-disable no-undef */
require("dotenv").config();
const userService = require("../services/user.service");
const { updateFileToGoogleDrive, uploadImageToImgur } = require("../common/utils");

const getUserInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    const userInfomation = await userService.getUserInfo(userId);
    res.status(200).json(userInfomation);
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateUserInfo = async (req, res) => {
  try {
    const userId = req.headers["userid"] || req.body.userId;
    if (!userId) {
      res.status(500).json({
        message: "Lỗi khi cập nhật thông tin người dùng",
      });
    }

    let avatar;

    if (req.file) {
      avatar = await uploadImageToImgur({ requestFile: req.file });
    } else {
      // Nếu không có file, sử dụng trực tiếp text được gửi
      avatar = req.body.avatar;
    }

    const updatedUser = await userService.updateUserInfo(
      userId,
      req.body,
      avatar
    );

    res.status(200).json({
      message: "Cập nhật thông tin người dùng thành công",
      updatedUser,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi cập nhật thông tin người dùng",
      error: err.response ? err.response.data : err.message,
    });
  }
};

const applyTeaching = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const userId = req.headers["userid"] || req.body.userId;
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const fileMimeType = req.file.mimetype;

    const fileUrl = await updateFileToGoogleDrive(
      fileBuffer,
      fileName,
      fileMimeType
    );

    const teachingApplication = await userService.applyTeaching(
      userId,
      fileUrl,
      req.body
    );
    res
      .status(200)
      .json({ message: "Apply teaching successfully", teachingApplication });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTeachingApplication = async (req, res) => {
  try {
    const userId = req.headers["userid"] || req.body.userId;
    const teachingApplication =
      await userService.getTeachingApplication(userId);
    res.status(200).json(teachingApplication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
  getUserInfo,
  updateUserInfo,
  applyTeaching,
  getTeachingApplication,
};
