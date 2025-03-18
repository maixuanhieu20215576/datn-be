const _ = require("lodash");
const Question = require("../models/question.model");
const { constants } = require("../constant");
const ReadingQuestion = require("../models/readingQuestion.model");
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

module.exports = { updateQuestions };
