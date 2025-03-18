const mongoose = require("mongoose");

const ReadingQuestionSchema = mongoose.Schema(
  {
    readingText: {
      type: String,
      required: true,
    },
    childQuestionIds: [mongoose.Schema.Types.ObjectId],
  },
  {
    timestamps: true,
  }
);

const ReadingQuestion = mongoose.model("ReadingQuestion", ReadingQuestionSchema);

module.exports = ReadingQuestion;
