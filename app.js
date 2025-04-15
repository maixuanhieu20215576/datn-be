/* eslint-disable no-console */
const express = require("express");
const helmet = require("helmet");
const xss = require("xss-clean");
const cors = require("cors");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const http = require("http");
const server = http.createServer(app);

const verificationRoute = require("./src/routes/verification.route");
const userRoute = require("./src/routes/user.route");
const adminRoute = require("./src/routes/admin.route");
const oneTimeJobRoute = require("./src/routes/oneTimeJob.route");
const courseRoute = require("./src/routes/course.route");
const paymentRoute = require("./src/routes/payment.route");
const ipnRoute = require("./src/routes/ipn.route");
const teacherRoute = require("./src/routes/teacher.route");
const Message = require("./src/models/message.model");
const { getGoogleDriveFile } = require("./src/common/utils");

app.use(helmet()); // Set security HTTP headers
app.use(xss()); // Sanitize request data
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

app.use("/verify", verificationRoute);
app.use("/user", userRoute);
app.use("/admin", adminRoute);
app.use("/one-time-job", oneTimeJobRoute);
app.use("/course", courseRoute);
app.use("/payment", paymentRoute);
app.use("/vnpay_ipn", ipnRoute);
app.use("/teacher", teacherRoute);

app.get("/api/proxy-pdf", getGoogleDriveFile);

// eslint-disable-next-line no-undef
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
    // eslint-disable-next-line no-constant-binary-expression
    origin: "https://datn-fe-l5pt.onrender.com" || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Start server
const PORT = 3100;
const socketIo = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
socketIo.on("connection", (socket) => {
  console.log("New client connected" + socket.id);

  socket.emit("getId", socket.id);

  socket.on("sendDataClient", async (data) => {
    await Message.create({
      senderId: new mongoose.Types.ObjectId(data.data.senderId),
      receiverId: new mongoose.Types.ObjectId(data.data.receiverId),
      content: data.data.content,
    });
    // Handle khi có sự kiện tên là sendDataClient từ phía client
    socketIo.emit("sendDataServer", { data }); // phát sự kiện  có tên sendDataServer cùng với dữ liệu tin nhắn từ phía server
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected"); // Khi client disconnect thì log ra terminal.
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
