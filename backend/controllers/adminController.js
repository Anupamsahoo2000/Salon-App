const { User, Appointment, Service, StaffProfile } = require("../models");

// ✅ Get All Customers
const getCustomers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const customers = await User.findAll({
      where: { role: "customer" },
      attributes: ["id", "name", "email", "phone", "role", "createdAt"],
    });
    res.status(200).json({ customers });
  } catch (error) {
    console.error("Admin Get Customers Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Update Customer (block/modify info)
const updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const user = await User.findByPk(customerId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.update(req.body);

    res.status(200).json({ message: "Customer updated", user });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ View All Appointments
const getAllAppointments = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Note: associations in models/index.js use aliases. Use the same `as` values
    // when eager-loading so Sequelize can resolve the associations.
    const appointments = await Appointment.findAll({
      include: [
        { model: User, as: "customer", attributes: ["name", "email"] },
        {
          model: StaffProfile,
          as: "staff",
          include: [{ model: User, as: "user", attributes: ["name"] }],
        },
        { model: Service, as: "service", attributes: ["name"] },
      ],
      order: [["appointmentDate", "DESC"]],
    });

    res.status(200).json({ appointments });
  } catch (error) {
    console.error("Admin Appointments Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Update Appointment Status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    appointment.status = status;
    await appointment.save();

    res.status(200).json({ message: "Status updated", appointment });
  } catch (error) {
    console.error("Update Appointment Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Delete Appointment
const deleteAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const deleted = await Appointment.destroy({ where: { id: appointmentId } });
    if (!deleted)
      return res.status(404).json({ message: "Appointment not found" });

    res.status(200).json({ message: "Appointment deleted" });
  } catch (error) {
    console.error("Delete Appointment Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getCustomers,
  updateCustomer,
  getAllAppointments,
  updateAppointmentStatus,
  deleteAppointment,
};
