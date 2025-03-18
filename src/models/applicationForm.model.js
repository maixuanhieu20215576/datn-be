const mongoose = require("mongoose");
const { constants } = require("../constant"); // Import constants

const ApplicationFormSchema = mongoose.Schema(
  {
    userId: {
      type: String,
    },
    fullName: {
      type: String,
    },
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
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const ApplicationForm = mongoose.model("ApplicationForm", ApplicationFormSchema);

module.exports = ApplicationForm;
