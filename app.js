const express = require("express");
const helmet = require("helmet");
const xss = require("xss-clean");
const cors = require("cors");
const app = express();
const path = require('path');
require("dotenv").config();
const mongoose = require("mongoose");

const verificationRoute = require("./src/routes/verification.route");
const userRoute = require("./src/routes/user.route")

app.use(helmet()); // Set security HTTP headers
app.use(xss()); // Sanitize request data
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

app.use("/verify", verificationRoute);
app.use("/user", userRoute);
// Set up a static file server for React build
app.use(express.static(path.join(__dirname, "build")));

// For any other route, serve the index.html to let React Router handle it
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});
const uri = process.env.MONGO_URI;
mongoose
  .connect(uri)
  .then(() => {
    console.log("Kết nối thành công đến MongoDB Atlas!");
  })
  .catch((err) => {
    console.error("Lỗi kết nối MongoDB Atlas:", err);
  });
app.use(
  cors({
    origin: "https://datn-fe-l5pt.onrender.com" || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Start server
const PORT = 3100;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
