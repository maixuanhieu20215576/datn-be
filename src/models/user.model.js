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
    fullName: {
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
    facebook: {
      type: String,
    },
    linkedin: {
      type: String,
    },
    bankPaymentInfo: {
      bankName: {
        type: String,
      },
      bankAccountNumber: {
        type: String,
      },
    },
    teachingInfo: {
      teachingLanguage: {
        type: [String],
      },
      startWorkAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
