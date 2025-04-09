const mongoose = require("mongoose");
const { constants } = require("../constant");

const NotificationSchema = mongoose.Schema(
  {
    sourceUserId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "User",
    },
    targetUser: [
      {
        targetUserId: {
          type: String,
        },
        status: {
          type: String,
          enum: constants.notificationStatus,
          default: constants.notificationStatus.new,
        },
      },
    ],
    title: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;
