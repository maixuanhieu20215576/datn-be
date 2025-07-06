/* eslint-disable no-undef */
const _ = require("lodash");
require("dotenv").config();
const axios = require("axios");
const FormData = require("form-data");
const { GoogleAuth } = require("google-auth-library");
const { google } = require("googleapis");
const { Readable } = require("stream");
const Notification = require("../models/notification.model");
const { default: mongoose } = require("mongoose");
const s3 = require("../s3");

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
  // eslint-disable-next-line no-undef
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

const getGoogleDriveFile = async (req, res) => {
  const { fileId } = req.query;

  if (!fileId || typeof fileId !== "string") {
    return res.status(400).json({ error: "Missing fileId" });
  }

  try {
    // eslint-disable-next-line no-undef
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });

    const drive = google.drive({ version: "v3", auth });

    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: "media",
      },
      { responseType: "arraybuffer" }
    );
    const fileBuffer = Buffer.from(response.data);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Content-Length", fileBuffer.length);
    res.setHeader("Access-Control-Allow-Origin", "*"); // allow iframe
    res.setHeader("X-Frame-Options", "ALLOWALL"); // critical for iframe
    res.setHeader("Content-Security-Policy", "frame-ancestors *");

    res.send(fileBuffer);
  } catch (error) {
    res.status(500).json(error);
  }
};

const uploadImageToImgur = async ({ requestFile }) => {
  try {
    const accessToken = await _getImgurAccessToken();

    const fileBuffer = requestFile.buffer;

    const form = new FormData();
    form.append("image", fileBuffer, {
      filename: requestFile.originalname,
      contentType: requestFile.mimetype,
    });
    const response = await axios.post("https://api.imgur.com/3/image", form, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...form.getHeaders(),
      },
      timeout: 10000,
    });

    const avatar = response.data.data.link;
    return avatar;
  } catch (err) {
    throw new Error(err);
  }
};

const removeVietnameseTone = (str) => {
  if (!str) return str;
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str;
};

const getCompareRatio = (a, b) => {
  if (!b) {
    if (a) return 1;
    return 0;
  }
  if (!a) return 0;
  if (a > b) return Math.round((a / b) * 10000) / 100;
  return -(100 - Math.round((a / b) * 10000) / 100);
};

const createNotification = async ({
  content,
  title,
  sourceUserId,
  targetUser,
}) => {
  await Notification.create({
    sourceUserId: new mongoose.Types.ObjectId(sourceUserId),
    targetUser,
    title,
    content,
  });
};

const getIntegerNumber = (num) => {
  const numStr = _.toString(num);
  const numIntString = _.split(numStr, ".")[0]; // Lấy phần trước dấu .
  return _.toNumber(numIntString);
};

const uploadFileToS3 = async (req) => {
  console.log(req)
  const file = req.file || req;
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: Date.now() + "-" + file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const data = await s3.upload(params).promise();
  return data.Location;
};

module.exports = {
  uploadImageToImgur,
  updateFileToGoogleDrive,
  removeVietnameseTone,
  getCompareRatio,
  createNotification,
  getIntegerNumber,
  getGoogleDriveFile,
  uploadFileToS3,
};
