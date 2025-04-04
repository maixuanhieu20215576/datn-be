const mongoose = require("mongoose");

const CommentSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    rating: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    classId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
const Comment = mongoose.model("Comment", CommentSchema);
module.exports = Comment;
