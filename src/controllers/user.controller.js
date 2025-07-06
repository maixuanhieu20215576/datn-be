/* eslint-disable no-undef */
require("dotenv").config();
const userService = require("../services/user.service");
const {
  updateFileToGoogleDrive,
  uploadImageToImgur,
  uploadFileToS3,
} = require("../common/utils");

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
      avatar = await uploadFileToS3(req);
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

const postComment = async (req, res) => {
  try {
    const {
      content,
      rating,
      teacherId,
      userId,
      teacherProfile,
      classId,
      mentionUserName,
      mentionUserId,
      courseId,
      isRootComment,
      replyTo,
    } = req.body;
    const newComment = await userService.postComment({
      teacherProfile,
      content,
      rating,
      teacherId,
      userId,
      classId,
      mentionUserName,
      mentionUserId,
      courseId,
      isRootComment,
      replyTo,
    });
    res.status(200).json(newComment);
  } catch (err) {
    res.status(500).json(err);
  }
};

const getCalendar = async (req, res) => {
  try {
    const { userId } = req.params;
    const calendar = await userService.getCalendar(userId);
    res.status(200).json(calendar);
  } catch (err) {
    res.status(500).json(err);
  }
};

const attendanceCheck = async (req, res) => {
  try {
    const { userId, classId } = req.body;
    const attendance = await userService.attendanceCheck(userId, classId);
    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json(err);
  }
};

const getBankList = async (req, res) => {
  try {
    const bankList = await userService.getBankList();
    res.status(200).json(bankList);
  } catch (err) {
    res.status(500).json(err);
  }
};

const getNotification = async (req, res) => {
  try {
    const { userId, page, status } = req.body;
    const notifications = await userService.getNotification({
      userId,
      page,
      status,
    });
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json(err);
  }
};

const markAsRead = async (req, res) => {
  try {
    await userService.markAllAsRead(req.body);
    res.status(200).json("Cập nhật thành công");
  } catch (err) {
    res.status(500).json(err);
  }
};

const fetchChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await userService.fetchChatHistory({ userId });
    res.status(200).json(chats);
  } catch (err) {
    res.status(500).json(err);
  }
};

const loadMessageHistory = async (req, res) => {
  try {
    const { userId, opponentId } = req.body;
    const messages = await userService.loadMessageHistory({
      userId,
      opponentId,
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json(err);
  }
};

const chatWithGpt = async (req, res) => {
  try {
    const { userMessage } = req.body;
    const response = await userService.chatWithGpt(userMessage);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json(err);
  }
};

const uploadFile = async (req, res) => {
  console.log(req.file)
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    let fileUrl;
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const fileMimeType = req.file.mimetype;
    if (fileMimeType === "image/png" || fileMimeType === "image/jpeg") {
      fileUrl = await uploadImageToImgur({ requestFile: req.file });
    } else {
      fileUrl = await uploadFileToS3(req.file);
    }
    res.status(200).json(fileUrl);
  } catch (err) {
    console.log(err)
    res.status(500).json({ err });
  }
};

const getClassHistory = async (req, res) => {
  try {
    const { classId, userId } = req.body;
    const classHistory = await userService.getClassHistory({ classId, userId });
    res.status(200).json(classHistory);
  } catch (err) {
    res.status(500).json(err);
  }
};
module.exports = {
  getUserInfo,
  updateUserInfo,
  applyTeaching,
  getTeachingApplication,
  postComment,
  getCalendar,
  attendanceCheck,
  getBankList,
  getNotification,
  markAsRead,
  fetchChatHistory,
  loadMessageHistory,
  chatWithGpt,
  uploadFile,
  getClassHistory,
};
