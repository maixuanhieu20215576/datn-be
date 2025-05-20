const mongoose = require("mongoose");

const TestResultSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    testId: {
      type: mongoose.Types.ObjectId,
      ref: "Test",
    },
    grade: Number,
    startIsoDate: {
      type: Number,
    },
    endIsoDate: {
      type: Number,
    },
    questionLogs: [
      {
        questionId: String,
        answer: Number,
        correctAnswer: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const TestResult = mongoose.model("TestResult", TestResultSchema);

module.exports = TestResult;
