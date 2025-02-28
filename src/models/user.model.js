const mongoose = require("mongoose");
const { constants } = require("../constant"); // Import constants

const UserSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: [
        constants.userRole.admin,
        constants.userRole.student,
        constants.userRole.teacher,
      ],
      default: constants.userRole.student,
    },
    name: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    email: {
      type: String,
    },
    avatar: {
      type: String,
    },
    language: {
      type: String,
      enum: [constants.language.vietnamese, constants.language.english],
      default: constants.language.english,
    },
    teachingApplication: {
      CV: String,
      languageSkills: String,
      teachingLanguage: [String],
      teachingCommitment: {
        type: String,
        enum: [constants.commitment.fulltime, constants.commitment.parttime],
      },
      status: {
        type: String,
        enum: [
          constants.applicationStatus.pending,
          constants.applicationStatus.approved,
          constants.applicationStatus.rejected,
        ],
      }
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
