/* eslint-env node */
const express = require("express");
const helmet = require("helmet");
const xss = require("xss-clean");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

const verificationRoute = require("./src/routes/verification.route");
const userRoute = require("./src/routes/user.route");
const adminRoute = require("./src/routes/admin.route");
const oneTimeJobRoute = require("./src/routes/oneTimeJob.route");
const courseRoute = require("./src/routes/course.route");
const paymentRoute = require("./src/routes/payment.route");
const ipnRoute = require("./src/routes/ipn.route");
const teacherRoute = require("./src/routes/teacher.route");

// Middleware
app.use(helmet());
app.use(xss());
app.use(
  cors({
    origin: ["https://datn-fe-l5pt.onrender.com", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// MongoDB Connection
// eslint-disable-next-line no-undef
const uri = process.env.MONGO_URI;
mongoose
  .connect(uri)
  // eslint-disable-next-line no-console
  .then(() => console.log("Kết nối thành công đến MongoDB Atlas!"))
  // eslint-disable-next-line no-console
  .catch((err) => console.error("Lỗi kết nối MongoDB Atlas:", err));

// API Routes
app.use("/verify", verificationRoute);
app.use("/user", userRoute);
app.use("/admin", adminRoute);
app.use("/one-time-job", oneTimeJobRoute);
app.use("/course", courseRoute);
app.use("/payment", paymentRoute);
app.use("/vnpay_ipn", ipnRoute);
app.use("/teacher", teacherRoute);

// Serve static files
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "build")));

// Catch-all route
app.get("*", (req, res) => {
  // eslint-disable-next-line no-undef
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Start server
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3100;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${PORT}`);
});
