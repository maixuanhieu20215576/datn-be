const _ = require("lodash");
const moment = require("moment");
const { stringify } = require("qs");
const { createHmac } = require("crypto");
const { Buffer } = require("buffer");
const { createPaymentRequest } = require("../services/course.service");
const orderSessionModel = require("../models/orderSession.model");
const { constants } = require("../constant");
const classModel = require("../models/class.model");
const systemLogModel = require("../models/systemLog.model");

require("dotenv").config();

const _sortObject = (obj) => {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  });
  return sorted;
};

const paymentWithVnpay = async ({
  total_amount,
  ipAddr,
  newOrderId,
  courseId,
  classId,
}) => {
  try {
    // eslint-disable-next-line no-undef
    const tmnCode = process.env.VNPAY_TMP_CODE;
    // eslint-disable-next-line no-undef
    const secretKey = `${process.env.VNPAY_SECRET_KEY}`;
    // eslint-disable-next-line no-undef
    const vnpUrl = `${process.env.VNPAY_URL}`;
    const returnUrl = classId
      ? // eslint-disable-next-line no-undef
        `${process.env.APP_BASE_ID}/class-detail/${classId}`
      : // eslint-disable-next-line no-undef
        `${process.env.APP_BASE_ID}/course/${courseId}`;

    // Generate timestamps
    const date = moment().utcOffset(7);
    const createDate = date.format("YYYYMMDDHHmmss");
    const orderId = newOrderId;
    const expireDate = moment().add(24, "hours").format("YYYYMMDDHHmmss");
    const amount = total_amount;
    const orderInfo = "Thanhtoanchokhachhang";
    const orderType = "200000";
    const locale = "vn";
    const currCode = "VND";

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: currCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };
    vnp_Params = _sortObject(vnp_Params);

    const signData = stringify(vnp_Params, { encode: false });
    const hmac = createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;

    const paymentUrl = `${vnpUrl}?${stringify(vnp_Params, {
      encode: false,
    })}`;
    return paymentUrl; // Return the generated VNPay payment URL
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in _paymentWithVnpay:", error);
    throw new Error("Payment generation failed.");
  }
};

const payment = async (req, res) => {
  try {
    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress ||
      "127.0.0.1";
    if (ipAddr === "::1" || ipAddr === "::1%0") {
      ipAddr = "127.0.0.1";
    }
    const { price, userId, courseId, classId } = req.body;

    const newOrderId = await createPaymentRequest({
      userId,
      courseId,
      price,
      classId,
    });

    const paymentUrl = await paymentWithVnpay({
      total_amount: price,
      ipAddr,
      newOrderId,
      courseId,
      classId,
    });
    res.status(200).json({ paymentUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const ipnVnpay = async (req, res) => {
  let vnp_Params = req.query;
  const secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = _sortObject(vnp_Params);
  // eslint-disable-next-line no-undef
  const secretKey = `${process.env.VNPAY_SECRET_KEY}`;
  const signData = stringify(vnp_Params, { encode: false });
  const hmac = createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  if (secureHash === signed) {
    const vnp_TransactionStatus = vnp_Params["vnp_TransactionStatus"];
    const vnp_TxnRef = vnp_Params["vnp_TxnRef"];

    try {
      if (vnp_TransactionStatus === "00") {
        const orderSession = await orderSessionModel.findByIdAndUpdate(
          vnp_TxnRef,
          { status: constants.paymentStatus.success },
          { new: true, projection: { classId: 1 } } // chỉ lấy classId
        );

        const classId = _.get(orderSession, "classId");
        if (classId) {
          await classModel.findByIdAndUpdate(classId, {
            $inc: { currentStudent: 1 },
          });
        } else {
          await systemLogModel.create({
            logType: "IPN Fail",
            logText: "ko co classId",
          });
        }
      } else {
        await orderSessionModel.findByIdAndUpdate(vnp_TxnRef, {
          status: constants.paymentStatus.failed,
        });
      }

      res.status(200).json({ RspCode: "00", Message: "success" });
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      res.status(200).json({ RspCode: "00", Message: "success" });
    }
  } else {
    res.status(200).json({ RspCode: "97", Message: "Fail checksum" });
  }
};
module.exports = { paymentWithVnpay, payment, ipnVnpay };
