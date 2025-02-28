const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("image"), userController.updateUserInfo);
router.get("/apply-teaching", userController.getTeachingApplication);
router.post("/apply-teaching", upload.single("file"), userController.applyTeaching);
router.get("/:userId", userController.getUserInfo);
module.exports = router;
