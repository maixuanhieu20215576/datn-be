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
const Course = require("../models/course.model");
const { uploadFileToS3 } = require("../common/utils");
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

const createCourseUnit = async (req, res) => {
  await Course.findOneAndUpdate(
    {
      course_name:
        "Mastering IELTS Writing: Task 2 (Achieve Band 7+ in 7 Hours)",
    },
    {
      $set: {
        units: [
          {
            unitName: "Unit 1: Introduction to IELTS Writing Task 2",
            unitContent: [
              {
                childUnitName: "Understanding the Task",
                unitOverview:
                  "An overview of what IELTS Writing Task 2 entails, question types, and marking criteria.",
                unitLecture:
                  "<p>In this section, you will learn about the different types of essay questions (opinion, discussion, problem-solution, advantages-disadvantages) and how they are assessed by IELTS examiners.</p>",
              },
              {
                childUnitName: "Common Myths and Mistakes",
                unitOverview:
                  "Debunking popular misconceptions about Task 2 and understanding common pitfalls.",
                unitLecture:
                  "<p>Many candidates think they must use complex vocabulary unnecessarily. This unit clarifies such myths and highlights what truly matters for high scores.</p>",
              },
            ],
          },
          {
            unitName: "Unit 2: Structuring Your Essay",
            unitContent: [
              {
                childUnitName: "Essay Structure Essentials",
                unitOverview:
                  "Learn the universal structure that applies to all Task 2 essays.",
                unitLecture:
                  "<p>We break down the ideal 4-paragraph essay: Introduction, Body Paragraph 1, Body Paragraph 2, and Conclusion. You’ll also understand the importance of topic sentences and logical flow.</p>",
              },
              {
                childUnitName: "Creating Effective Thesis Statements",
                unitOverview:
                  "Master the art of crafting strong, clear thesis statements.",
                unitLecture:
                  "<p>Your thesis statement tells the examiner your opinion or the direction of your essay. A strong thesis is specific and directly addresses the question.</p>",
              },
            ],
          },
          {
            unitName: "Unit 3: Developing Ideas and Arguments",
            unitContent: [
              {
                childUnitName: "Generating Ideas Quickly",
                unitOverview:
                  "Techniques to brainstorm ideas within 5 minutes under exam pressure.",
                unitLecture:
                  "<p>Using mind maps, question prompts, and familiar topics to rapidly produce high-quality ideas suitable for academic writing.</p>",
              },
              {
                childUnitName: "Building Coherent Arguments",
                unitOverview: "Organizing ideas logically and persuasively.",
                unitLecture:
                  "<p>Focus on logical progression, linking devices, and maintaining a clear argument through examples and explanations.</p>",
              },
            ],
          },
          {
            unitName: "Unit 4: Language for High Scores",
            unitContent: [
              {
                childUnitName: "Using Complex Sentences",
                unitOverview:
                  "How to form complex structures naturally without grammatical errors.",
                unitLecture:
                  "<p>Learn about relative clauses, conditional sentences, and other advanced structures that can boost your grammatical range and accuracy score.</p>",
              },
              {
                childUnitName: "Academic Vocabulary",
                unitOverview:
                  "Essential academic words and phrases for a formal writing style.",
                unitLecture:
                  "<p>Avoid informal expressions. Learn collocations and topic-specific vocabulary that can enhance your lexical resource band.</p>",
              },
            ],
          },
          {
            unitName: "Unit 5: Practice and Model Answers",
            unitContent: [
              {
                childUnitName: "Analyzing Band 9 Essays",
                unitOverview:
                  "Study model answers to understand what a perfect essay looks like.",
                unitLecture:
                  "<p>We dissect Band 9 essays to observe structure, language use, coherence, and how they fulfill all band descriptors effectively.</p>",
              },
              {
                childUnitName: "Timed Practice Tests",
                unitOverview: "Practice writing essays within 40 minutes.",
                unitLecture:
                  "<p>Apply everything you've learned by attempting practice essays under exam conditions, followed by detailed feedback and improvement suggestions.</p>",
              },
            ],
          },
        ],
      },
    },
    { new: true } // optional: return document after update
  );
  res.status(200).json("ok");
};

const createFileTestS3 = async (req, res) => {
  try {
    await uploadFileToS3(req);
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
  createCourseUnit,
  createFileTestS3,
};
