const mongoose = require("mongoose");
const { constants } = require("../constant");

const QuestionWithSubQuestionsSchema = mongoose.Schema(
  {
    readingText: {
      type: String,
    },
    audioUrl: {
      type: String,
    },
    childQuestionIds: [mongoose.Schema.Types.ObjectId],
    testId: String,
    questionType: {
      type: String,
      enum: constants.questionType,
    },
  },
  {
    timestamps: true,
  }
);

const QuestionWithSubQuestions = mongoose.model(
  "QuestionWithSubQuestions",
  QuestionWithSubQuestionsSchema
);

module.exports = QuestionWithSubQuestions;
