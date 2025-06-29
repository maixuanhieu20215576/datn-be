const mongoose = require("mongoose");
const { constants } = require("../constant");

const TestSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    numberOfQuestions: {
      type: Number,
    },
    language: {
      type: String,
      enum: constants.languages,
    },
    maxGrade: {
      type: Number,
      default: 100,
    },
    timeLimitByMinutes: {
      type: Number,
    },
    thumbnail: {
      type: String,
      default:
        "https://data.lvo.vn/media/upload/1002364/test-intelligenza-sociale.jpg",
    },
    examDate: {
      type: Date,
    },
    examTime: {
      type: String,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
  },
  {
    timestamps: true,
  }
);

const Test = mongoose.model("Test", TestSchema);

module.exports = Test;
