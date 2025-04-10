const _ = require("lodash");
const Question = require("../models/question.model");
const { constants } = require("../constant");
const ReadingQuestion = require("../models/readingQuestion.model");
const orderSessionModel = require("../models/orderSession.model");
const mongoose = require("mongoose");
const moment = require("moment");
const axios = require("axios");
const classModel = require("../models/class.model");
const SalaryModel = require("../models/salary.model");
const VietQrBank = require("../models/vietQr.model");
const User = require("../models/user.model");
const Message = require("../models/message.model");
const updateQuestions = async (req, res) => {
  try {
    const allQuestions = await Question.find({
      questionType: constants.questionType.reading,
    });
    for (const question of allQuestions) {
      const childQuestionId = _.get(question, "_id");
      const readingText = _.get(question, "reading_text");
      const readingQuestion = await ReadingQuestion.findOneAndUpdate(
        { readingText: readingText }, // Điều kiện tìm kiếm
        {
          $push: { childQuestionIds: childQuestionId }, // Cập nhật mảng nếu tài liệu đã tồn tại
        },
        {
          upsert: true, // Nếu không tìm thấy, tạo mới tài liệu
          new: true, // Trả về tài liệu mới sau khi upsert
          setDefaultsOnInsert: true, // Đảm bảo tạo mảng childQuestionIds nếu tài liệu mới
          fields: { readingText, childQuestionIds: [childQuestionId] }, // Đảm bảo tạo đúng tài liệu mới
        }
      );
      const readingQuestionId = _.get(readingQuestion, "_id");
      await Question.findByIdAndUpdate(childQuestionId, {
        $set: { readingQuestionId: readingQuestionId },
      });
    }
    res.status(200).json("OK");
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateSalaries = async (req, res) => {
  try {
    const orderSessions = await orderSessionModel.find({
      status: constants.paymentStatus.success,
    });

    for (const orderSession of orderSessions) {
      const classId = _.get(orderSession, "classId");
      if (classId) {
        const classDetail = await classModel.findById(classId);

        const teacherId = classDetail.teacherId;
        const price = _.get(orderSession, "price");
        const createdAt = _.get(orderSession, "createdAt");
        const createdAtDate = new Date(createdAt);
        await SalaryModel.findOneAndUpdate(
          {
            teacherId: new mongoose.Types.ObjectId(teacherId),
            month: moment(createdAtDate).format("MM"),
            year: moment(createdAtDate).format("YYYY"),
          },
          {
            $inc: { salary: (price * 9) / 10 },
          },
          {
            new: true,
            upsert: true,
          }
        );
      }
    }
    res.status(200).json("OK");
  } catch (err) {
    res.status(500).json(err);
  }
};

const getVietQRBankCode = async (req, res) => {
  try {
    const response = await axios.get("https://api.vietqr.io/v2/banks");
    const vietQrBanks = response.data.data;
    for (const vietQrBank of vietQrBanks) {
      const {
        id,
        code,
        bin,
        logo,
        transferSupported,
        lookupSupported,
        shortName,
        name,
      } = vietQrBank;

      await VietQrBank.create({
        bankId: id,
        bankCode: code,
        bankBin: bin,
        logo,
        transferSupported,
        lookupSupported,
        shortName,
        bankName: name,
      });
    }
    res.status(200).json("OK");
  } catch (err) {
    res.status(500).json(err);
  }
};

const createAdminMessage = async (req, res) => {
  try {
    const users = await User.find();
    for (const user of users) {
      if (user.role !== constants.userRole.admin) {
        await Message.create({
          senderId: new mongoose.Types.ObjectId("67c28edae0336995eebf59d9"),
          receiverId: user._id,
          content:
            "Chào mừng đến với nền tảng học trực tuyến EzLearn ! Đây là đoạn hội thoại để bạn có thể trình bày các thắc mắc, khiếu nại và đóng góp cho hệ thống",
        });
      }
    }
    res.status(200).json("ok");
  } catch (err) {
    res.status(500).json(err);
  }
};
module.exports = {
  updateQuestions,
  updateSalaries,
  getVietQRBankCode,
  createAdminMessage,
};
