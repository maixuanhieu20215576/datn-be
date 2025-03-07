const express = require("express");
const helmet = require("helmet");
const xss = require("xss-clean");
const cors = require("cors");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");

const verificationRoute = require("./src/routes/verification.route");
const userRoute = require("./src/routes/user.route");
const adminRoute = require("./src/routes/admin.route");

app.use(helmet()); // Set security HTTP headers
app.use(xss()); // Sanitize request data
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

app.use("/verify", verificationRoute);
app.use("/user", userRoute);
app.use("/admin", adminRoute);
// Set up a static file server for React build

// eslint-disable-next-line no-undef
const uri = process.env.MONGO_URI;
mongoose
  .connect(uri)
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("Kết nối thành công đến MongoDB Atlas!");
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Lỗi kết nối MongoDB Atlas:", err);
  });
app.use(
  cors({
    // eslint-disable-next-line no-constant-binary-expression
    origin: "https://datn-fe-l5pt.onrender.com" || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Start server
const PORT = 3100;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${PORT}`);
});
