const { constants } = require("../constant");
const mongoose = require("mongoose");

const ClassSchema = mongoose.Schema({
  teacherId: {
    type: String,
    required: true,
  },
  teacherName: {
    type: String,
    required: true,
  },
  maxStudent: {
    type: Number,
  },
  currentStudent: {
    type: Number,
    default: 0,
  },

  language: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    enum: constants.courseLevel,
  },
  price: {
    type: Number,
    required: true,
  },
  priceType: {
    type: String,
    required: true,
    enum: constants.priceType,
  },
  status: {
    type: String,
    required: true,
    default: "open",
  },
  schedule: {
    type: [
      {
        date: {
          type: String,
        },
        timeFrom: {
          type: String,
          required: true,
        },
        timeTo: {
          type: String,
          required: true,
        },
      },
    ],
  },
  classUrl: {
    type: String,
    required: true,
  },
  classType: {
    type: String,
    required: true,
    enum: constants.classType,
  },
});

module.exports = mongoose.model("Class", ClassSchema);
