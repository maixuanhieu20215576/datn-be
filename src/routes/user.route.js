const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("image"), userController.updateUserInfo);
router.get("/apply-teaching", userController.getTeachingApplication);
router.post(
  "/apply-teaching",
  upload.single("file"),
  userController.applyTeaching
);
router.post("/post-comment", userController.postComment);
router.get("/get-calendar/:userId", userController.getCalendar);
router.post("/attendance-check", userController.attendanceCheck);
router.get("/get-bank-list", userController.getBankList);
router.post("/get-notification", userController.getNotification);
router.post("/mark-all-notification-as-read", userController.markAsRead);
router.get("/fetch-chat-history/:userId", userController.fetchChatHistory);
router.post("/load-message-history", userController.loadMessageHistory);
router.post("/chat-with-gpt", userController.chatWithGpt);
router.post("/upload-file", upload.single("file"), userController.uploadFile);
router.post('/get-class-history', userController.getClassHistory);
router.get("/:userId", userController.getUserInfo);
module.exports = router;
