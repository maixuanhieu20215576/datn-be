const express = require("express");
const helmet = require("helmet");
const xss = require("xss-clean");
const cors = require("cors");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");

const verificationRoute = require("./src/routes/verification.route");

app.use(helmet()); // Set security HTTP headers
app.use(xss()); // Sanitize request data
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

app.use("/verify", verificationRoute);

const uri = process.env.MONGO_URI;
mongoose
  .connect(uri)
  .then(() => {
    console.log("Kết nối thành công đến MongoDB Atlas!");
  })
  .catch((err) => {
    console.error("Lỗi kết nối MongoDB Atlas:", err);
  });

// Start server
const PORT = 3100;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
