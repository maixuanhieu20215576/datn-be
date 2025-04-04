const mongoose = require("mongoose");
const TeachingHistory = mongoose.Schema(
  {
    teacherId: {
      type: String,
      required: true,
    },
    classId: {
      type: String,
      required: true,
    },
    teacherName: {
      type: String,
    },
    subTeacherId: {
      type: String,
    },
    subTeacherName: {
      type: String,
    },
    numberAttendant: {
      type: Number,
    },
    numberOfAbsentStudent: {
      type: Number,
    },
    teachingDate: {
      type: Date,
    },
  },
  {
    timestamp: true,
  }
);

module.exports = mongoose.model("TeachingHistory", TeachingHistory);
