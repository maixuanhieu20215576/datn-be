/* eslint-disable no-undef */
const express = require("express");
const router = express.Router();
require("dotenv").config();

const s3 = require('../s3')
router.post("/generate-presigned-url", (req, res) => {
  const { fileName, fileType } = req.body;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `uploads/${Date.now()}-${fileName}`,
    Expires: 60,
    ContentType: fileType, // ⚠️ PHẢI có nếu FE gửi Content-Type
  };

  s3.getSignedUrl("putObject", params, (err, url) => {
    if (err) {
      return res.status(500).json({ error: "Không tạo được presigned URL" });
    }

    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    res.json({ uploadUrl: url, fileUrl });
  });
});


  module.exports = router;