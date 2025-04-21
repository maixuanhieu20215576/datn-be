const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const CommentSchema = new mongoose.Schema(
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
    },
    content: {
      type: String,
      required: true,
    },
    classId: {
      type: String,
    },
    courseId: {
      type: String,
    },
    mentionUserId: {
      type: String,
    },
    mentionUserName: {
      type: String,
    },
    isRootComment: {
      type: Boolean,
      default: true,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    replyComments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ]
  },
  {
    timestamps: true,
  }
);

// ✅ Enable pagination
CommentSchema.plugin(mongoosePaginate);

const Comment = mongoose.model("Comment", CommentSchema);
module.exports = Comment;
