const mongoose = require("mongoose");
const { constants } = require("../constant"); // Import constants

const QuestionSchema = mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    choice_1: {
      type: String,
      required: true,
    },
    choice_2: {
      type: String,
      required: true,
    },
    choice_3: {
      type: String,
      required: true,
    },
    choice_4: {
      type: String,
      required: true,
    },
    answer: {
      type: Number,
      required: true,
    },
    entranceExamField: {
      type: String,
      enum: constants.entranceExamField,
    },
    questionType: {
      type: String,
      enum: constants.questionType,
    },
    reading_text: {
      type: String,
    },
    readingQuestionId: { type: mongoose.Schema.Types.ObjectId },
    testId: String,
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.model("Question", QuestionSchema);

module.exports = Question;
