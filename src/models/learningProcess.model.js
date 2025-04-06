const mongoose = require("mongoose");
const { constants } = require("../constant");
const LearningProcessSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classId: {
      type: String,
      required: true,
    },
    teacherName: {
      type: String,
    },
    teacherId: {
      type: String,
    },
    className: {
      type: String,
    },
    attendanceHistory: [
      {
        classDate: {
          type: String,
        },
        attendanceStatus: {
          type: String,
          enum: constants.attendanceStatus,
        },
      },
    ],
    subTeacherId: {
      type: String,
    },
    subTeacherName: {
      type: String,
    },
    ratingByUser: {
      type: Number,
    },
    commentByUser: {
      type: String,
    },
  },
  {
    timestamp: true,
  }
);

module.exports = mongoose.model("LearningProcess", LearningProcessSchema);
