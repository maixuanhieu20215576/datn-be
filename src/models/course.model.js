const mongoose = require("mongoose");
const { constants } = require("../constant");

const CourseSchema = mongoose.Schema(
  {
    course_name: {
      type: String,
      required: true,
    },
    course_instr: {
      type: String,
    },
    course_rating: {
      type: Number,
    },
    course_totalHourse: {
      type: Number,
    },
    course_lectures: {
      type: Number,
    },
    course_level: {
      type: String,
      enum: constants.courseLevel,
    },
    price: {
      type: Number,
      required: true,
    },
    price_dis: {
      type: Number,
    },
    course_enrollmenters: {
      type: Number,
    },
    language: {
      type: String,
    },
    thumbnail: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.model("Course", CourseSchema);

module.exports = Course;
