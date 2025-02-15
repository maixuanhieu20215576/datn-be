const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const multer = require("multer");
const upload = multer({ dest: 'uploads/' });

router.get("/", userController.getUserInfo);
router.post("/", upload.single("image"), userController.updateUserInfo);
module.exports = router;
