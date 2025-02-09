const mongoose = require("mongoose");
const { constants } = require('../constant'); // Import constants

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
    
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
