const mongoose = require("mongoose");
const { constants } = require("../constant");

const Salary = mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  salary: {
    type: Number,
    required: true,
  },
  month: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: constants.salaryPaymentStatus,
    default: constants.salaryPaymentStatus.unpaid,
  },
  paymentByAdminId: {
    type: String,
  },
  paymentByAdminName: {
    type: String,
  },
  paymentDate: {
    type: Date,
  },
});

const SalaryModel = mongoose.model("Salary", Salary);
module.exports = SalaryModel;
