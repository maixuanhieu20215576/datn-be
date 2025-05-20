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
    },
    timeLimitByMinutes: {
      type: Number,
    },
    thumbnail: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Test = mongoose.model("Test", TestSchema);

module.exports = Test;
