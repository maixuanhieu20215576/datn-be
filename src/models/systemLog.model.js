const mongoose = require("mongoose");

const SystemLog = mongoose.Schema({
  logType: {
    type: String,
  },
  logText: {
    type: String,
  },
});

module.exports = mongoose.model("SystemLog", SystemLog);
