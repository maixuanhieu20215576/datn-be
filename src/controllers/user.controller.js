/* eslint-disable no-undef */
require("dotenv").config();
const axios = require("axios");
const userService = require("../services/user.service");
const FormData = require("form-data");
const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const { Readable } = require("stream");

const _getImgurAccessToken = async () => {
  const response = await axios.post(
    "https://api.imgur.com/oauth2/token",
    new URLSearchParams({
      client_id: process.env.IMGUR_CLIENT_ID,
      client_secret: process.env.IMGUR_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: process.env.IMGUR_REFRESH_TOKEN,
    }).toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  return response.data.access_token;
};

const updateFileToGoogleDrive = async (fileBuffer, fileName, fileMimeType) => {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

  // Xác thực Google Drive API
  const auth = new GoogleAuth({
    credentials: credentials,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const drive = google.drive({ version: "v3", auth });
  const fileMetadata = {
    name: fileName, // Tên file trên Google Drive giống file upload
  };

  const media = {
    mimeType: fileMimeType,
    body: Readable.from(fileBuffer),
  };

  // Gửi yêu cầu upload file lên Google Drive
  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id",
  });
  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: {
      role: "reader", // Cho phép chỉ đọc (viewer)
      type: "anyone", // Bất kỳ ai có link đều xem được
    },
  });

  const fileUrl = `https://drive.google.com/file/d/${file.data.id}/view`;
  return fileUrl;
};
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
    const accessToken = await _getImgurAccessToken();
    const userId = req.headers["userid"] || req.body.userId;
    if (!userId) {
      res.status(500).json({
        message: "Lỗi khi cập nhật thông tin người dùng",
      });
    }
    let avatar;

    if (req.file) {
      const fileBuffer = req.file.buffer;

      const form = new FormData();
      form.append("image", fileBuffer, {
        filename: req.file.originalname,
        contentType: fileMimeType,
      });
      const response = await axios.post("https://api.imgur.com/3/image", form, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...form.getHeaders(),
        },
        timeout: 10000,
      });

      avatar = response.data.data.link;
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
