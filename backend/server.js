const express = require("express");
const app = express();
const db = require("./config/db");
require("dotenv").config();
require("./cron/reminder");

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const staffRoutes = require("./routes/staffRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/services", serviceRoutes);
app.use("/staff", staffRoutes);
app.use("/appointment", appointmentRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
