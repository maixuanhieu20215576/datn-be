const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

router.get("/", paymentController.ipnVnpay);

module.exports = router;