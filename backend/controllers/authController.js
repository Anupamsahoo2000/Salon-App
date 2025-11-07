const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, StaffProfile, Appointment, Service } = require("../models");

const signup = async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(403).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || "customer",
    });

    if (newUser.role === "staff") {
      await StaffProfile.create({
        userId: newUser.id,
        specialization: "General",
        workingHours: {
          monday: "10:00-18:00",
          tuesday: "10:00-18:00",
          wednesday: "10:00-18:00",
          thursday: "10:00-18:00",
          friday: "10:00-18:00",
          saturday: "10:00-18:00",
        },
      });
    }

    return res.status(201).json({
      message: "User registered successfully",
      response: newUser,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: StaffProfile,
          as: "staffProfile",
          include: [
            {
              model: Appointment,
              as: "staffAppointments",
              where: {
                status: ["booked", "completed"], // ✅ Only approved statuses
              },
              required: false,
              include: [
                { model: Service, as: "service" },
                { model: User, as: "customer" },
              ],
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffProfile: user.staffProfile || null,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { signup, login };
