const mongoose = require("mongoose");
const VietQrBankSchema = mongoose.Schema({
  bankId: {
    type: String,
  },
  bankCode: {
    type: String,
    required: true,
  },
  bankName: {
    type: String,
    required: true,
  },
  bankBin: {
    type: String,
    required: true,
  },
  shortName: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
  },
  transferSupported: { type: Number },
  lookupSupported: { type: Number },
});

const VietQrBank = mongoose.model("VietQrBank", VietQrBankSchema);

module.exports = VietQrBank;
