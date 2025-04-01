const mongoose = require("mongoose");
const { constants } = require("../constant");
const OrderSessionSchema = mongoose.Schema(
  {
    courseId: {
      type: String,
    },
    classId: {
      type: String
    },
    userId: {
      type: String,
    },
    username: {
      type: String,
    },
    email: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    price: {
      type: Number,
    },
    status: {
      type: String,
      enum: constants.paymentStatus,
      default: constants.paymentStatus.pending,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("OrderSession", OrderSessionSchema);
