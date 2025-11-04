const { Appointment, StaffProfile, Service, User } = require("../models");
const { Op } = require("sequelize");
const { sendEmail } = require("../utils/email");

const generateSlots = (start, end, duration) => {
  const slots = [];
  let current = new Date(start);

  while (current < end) {
    const next = new Date(current.getTime() + duration * 60000);
    if (next <= end) slots.push(new Date(current));
    current = next;
  }
  return slots;
};

const getAvailableSlots = async (req, res) => {
  try {
    const { staffProfileId, serviceId, date } = req.query;

    if (!staffProfileId || !serviceId || !date)
      return res.status(400).json({ message: "Missing required parameters" });

    const staff = await StaffProfile.findByPk(staffProfileId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const service = await Service.findByPk(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const day = new Date(date)
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();

    const workingHours = staff.workingHours?.[day];
    if (!workingHours) return res.status(200).json({ availableSlots: [] });

    const [startTime, endTime] = workingHours.split("-");

    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);

    let allSlots = generateSlots(start, end, service.durationMinutes);

    const booked = await Appointment.findAll({
      where: {
        staffProfileId,
        appointmentDate: {
          [Op.between]: [start, end],
        },
        status: "booked",
      },
    });

    const bookedTimes = booked.map((a) =>
      new Date(a.appointmentDate).getTime()
    );

    const availableSlots = allSlots.filter(
      (s) => !bookedTimes.includes(s.getTime())
    );

    return res.status(200).json({ availableSlots });
  } catch (error) {
    console.error("Slots Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Book Appointment
const bookAppointment = async (req, res) => {
  try {
    const { staffProfileId, serviceId, appointmentDate } = req.body;
    const customerId = req.user.userId;

    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Customers only allowed" });
    }

    const service = await Service.findByPk(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const staff = await StaffProfile.findByPk(staffProfileId, {
      include: [{ model: User, as: "user", attributes: ["name"] }],
    });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    // Prevent double bookings
    const conflict = await Appointment.findOne({
      where: {
        staffProfileId,
        appointmentDate,
        status: "booked",
      },
    });
    if (conflict)
      return res.status(400).json({ message: "Slot already booked" });

    // ✅ Appointment created as PENDING (not booked)
    const appointment = await Appointment.create({
      customerId,
      staffProfileId,
      serviceId,
      appointmentDate,
      status: "pending",
      paymentStatus: "pending",
    });

    res.status(201).json({
      message: "Appointment reserved — pending payment",
      appointment,
    });
  } catch (error) {
    console.error("Book Appointment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ View My Appointments
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      where: { customerId: req.user.userId },
      include: [
        { model: Service, as: "service", attributes: ["name", "price"] },
        {
          model: StaffProfile,
          as: "staff",
          include: [{ model: User, as: "user", attributes: ["name"] }],
        },
      ],
      order: [["appointmentDate", "DESC"]],
    });

    res.status(200).json({ appointments });
  } catch (err) {
    console.error("Appointments Fetch Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Cancel Appointment
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.userId;

    const appointment = await Appointment.findOne({
      where: { id, customerId, status: ["pending", "booked"] },
      include: [
        { model: Service, as: "service", attributes: ["name"] },
        {
          model: StaffProfile,
          as: "staff",
          include: [{ model: User, as: "user", attributes: ["name"] }],
        },
      ],
    });

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    appointment.status = "cancelled";
    await appointment.save();

    res.status(200).json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error("Cancel Appointment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Reschedule Appointment
const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { newAppointmentDate } = req.body;

    if (!newAppointmentDate)
      return res.status(400).json({ message: "New appointment date required" });

    const customerId = req.user.userId;

    // ✅ Only the customer who booked can reschedule
    if (req.user.role !== "customer") {
      return res
        .status(403)
        .json({ message: "Access denied. Customers only." });
    }

    const appointment = await Appointment.findOne({
      where: {
        id: appointmentId,
        customerId,
        status: "booked",
      },
      include: [
        {
          model: StaffProfile,
          as: "staff",
        },
        {
          model: Service,
          as: "service",
          attributes: ["durationMinutes"],
        },
      ],
    });

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    // ✅ Prevent conflicts
    const conflict = await Appointment.findOne({
      where: {
        staffProfileId: appointment.staffProfileId,
        appointmentDate: newAppointmentDate,
        status: "booked",
      },
    });

    if (conflict)
      return res.status(400).json({ message: "Slot already booked" });

    appointment.appointmentDate = newAppointmentDate;
    await appointment.save();

    await sendEmail(
      req.user.email,
      "Appointment Cancelled ❌",
      `Your appointment has been cancelled.`
    );

    return res.status(200).json({
      message: "Appointment rescheduled successfully ✅",
      appointment,
    });
  } catch (err) {
    console.error("Reschedule Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get Appointment by ID
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id, {
      include: [
        { model: User, as: "customer", attributes: ["id", "name", "email"] },
        {
          model: Service,
          as: "service",
          attributes: ["id", "name", "price", "durationMinutes"],
        },
        {
          model: StaffProfile,
          as: "staff",
          include: [{ model: User, as: "user", attributes: ["id", "name"] }],
        },
      ],
    });

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    res.status(200).json({ appointment });
  } catch (error) {
    console.error("Get Appointment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { appointmentId, paymentOrderId } = req.body;

    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        { model: Service, as: "service", attributes: ["name"] },
        {
          model: StaffProfile,
          as: "staff",
          include: [{ model: User, as: "user", attributes: ["name"] }],
        },
      ],
    });

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    // ✅ Mark as successfully booked
    appointment.status = "booked";
    appointment.paymentStatus = "success";
    appointment.paymentOrderId = paymentOrderId;
    await appointment.save();

    const customer = await User.findByPk(appointment.customerId);

    // ✅ Send confirmation email only after payment success
    await sendEmail(
      customer.email,
      "Payment Success ✅ Appointment Confirmed",
      `
      <h2>Your Appointment is Confirmed ✅</h2>
      <p><strong>Service:</strong> ${appointment.service.name}</p>
      <p><strong>Date & Time:</strong> ${new Date(
        appointment.appointmentDate
      ).toLocaleString()}</p>
      <p><strong>Staff:</strong> ${appointment.staff.user.name}</p>
      <br>
      <p>Thank you for choosing us! 💖</p>
      `
    );

    res.status(200).json({
      message: "Payment confirmed & appointment booked",
      appointment,
    });
  } catch (error) {
    console.error("Confirm Payment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
  getAppointmentById,
  confirmPayment,
};
