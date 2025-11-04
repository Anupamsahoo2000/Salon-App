const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./config/db");
require("dotenv").config();
require("./cron/reminder");

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
const path = require("path");
// Serve static files from frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const staffRoutes = require("./routes/staffRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/services", serviceRoutes);
app.use("/staff", staffRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/payment", paymentRoutes);
app.use("/reviews", reviewRoutes);
app.use("/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
