const { Appointment, StaffProfile, Service, User } = require("../models");
const { Op } = require("sequelize");
const { sendEmail } = require("../utils/email");

// ✅ Utility: generate time slots
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

// ✅ Get available slots for staff on a selected date
const getAvailableSlots = async (req, res) => {
  try {
    const { staffProfileId, serviceId, date } = req.query;
    if (!staffProfileId || !serviceId || !date) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    const service = await Service.findByPk(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const staff = await StaffProfile.findByPk(staffProfileId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const day = new Date(date).toLocaleDateString("en-US", {
      weekday: "lowercase",
    });

    const workingHours = staff.workingHours?.[day];

    if (!workingHours) {
      return res.status(200).json({ availableSlots: [] }); // Not working that day
    }

    const [startTime, endTime] = workingHours.split("-");
    const start = new Date(`${date} ${startTime}`);
    const end = new Date(`${date} ${endTime}`);

    // Generate all possible slots
    let allSlots = generateSlots(start, end, service.durationMinutes);

    // Fetch already booked slots
    const bookedAppointments = await Appointment.findAll({
      where: {
        staffProfileId,
        appointmentDate: {
          [Op.between]: [start, end],
        },
        status: "booked",
      },
    });

    const bookedTimes = bookedAppointments.map((a) =>
      new Date(a.appointmentDate).getTime()
    );

    // Filter unavailable slots
    const availableSlots = allSlots.filter(
      (slot) => !bookedTimes.includes(new Date(slot).getTime())
    );

    return res.status(200).json({ availableSlots });
  } catch (error) {
    console.error("Get Slots Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Book Appointment
const bookAppointment = async (req, res) => {
  try {
    const { staffProfileId, serviceId, appointmentDate } = req.body;
    const customerId = req.user.id;

    const service = await Service.findByPk(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const staff = await StaffProfile.findByPk(staffProfileId, {
      include: [{ model: User, attributes: ["name"] }],
    });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const existing = await Appointment.findOne({
      where: {
        staffProfileId,
        appointmentDate,
        status: "booked",
      },
    });
    if (existing)
      return res.status(400).json({ message: "Slot already booked" });

    const appointment = await Appointment.create({
      customerId,
      staffProfileId,
      serviceId,
      appointmentDate,
    });

    const customer = await User.findByPk(customerId);

    await sendEmail(
      customer.email,
      "Appointment Confirmed ✅",
      `
        <h2>Your Appointment is Confirmed ✅</h2>
        <p><strong>Service:</strong> ${service.name}</p>
        <p><strong>Date & Time:</strong> ${new Date(
          appointmentDate
        ).toLocaleString()}</p>
        <p><strong>Staff:</strong> ${staff.user.name}</p>
        <br>
        <p>Thank you for booking with us!</p>
      `
    );

    res.status(201).json({
      message: "Appointment booked",
      appointment,
    });
  } catch (error) {
    console.log("Book Appointment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ View My Appointments
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      where: { customerId: req.user.id },
      include: [
        { model: Service, attributes: ["name", "price"] },
        {
          model: StaffProfile,
          include: [{ model: User, attributes: ["name"] }],
        },
      ],
    });

    res.status(200).json({ appointments });
  } catch (error) {
    console.log("Get Appointments Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const customerId = req.user.id;

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, customerId, status: "booked" },
      include: [
        { model: Service, attributes: ["name"] },
        {
          model: StaffProfile,
          include: [{ model: User, attributes: ["name"] }],
        },
      ],
    });

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    // Update status
    appointment.status = "cancelled";
    await appointment.save();

    const customer = await User.findByPk(customerId);

    await sendEmail(
      customer.email,
      "Appointment Cancelled ❌",
      `
      <h2>Your Appointment Has Been Cancelled</h2>
      <p><strong>Service:</strong> ${appointment.service.name}</p>
      <p><strong>Originally Scheduled:</strong> ${new Date(
        appointment.appointmentDate
      ).toLocaleString()}</p>
      <br>
      <p>We hope to assist you again soon!</p>
      `
    );

    res.status(200).json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    console.log("Cancel Appointment Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { newAppointmentDate } = req.body;
    const customerId = req.user.id;

    if (!newAppointmentDate)
      return res.status(400).json({ message: "New appointment date required" });

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, customerId, status: "booked" },
      include: [
        { model: Service, attributes: ["name", "durationMinutes"] },
        {
          model: StaffProfile,
          include: [{ model: User, attributes: ["name"] }],
        },
      ],
    });

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    // Prevent booking conflict
    const conflict = await Appointment.findOne({
      where: {
        staffProfileId: appointment.staffProfileId,
        appointmentDate: newAppointmentDate,
        status: "booked",
      },
    });

    if (conflict)
      return res.status(400).json({ message: "New slot already booked" });

    appointment.appointmentDate = newAppointmentDate;
    await appointment.save();

    const customer = await User.findByPk(customerId);

    await sendEmail(
      customer.email,
      "Appointment Rescheduled 🔁",
      `
      <h2>Your Appointment Has Been Rescheduled</h2>
      <p><strong>Service:</strong> ${appointment.service.name}</p>
      <p><strong>New Date & Time:</strong> ${new Date(
        newAppointmentDate
      ).toLocaleString()}</p>
      <p><strong>Assigned Staff:</strong> ${appointment.staff.user.name}</p>
      <br>
      <p>Looking forward to your visit! 😊</p>
      `
    );

    res.status(200).json({
      message: "Appointment rescheduled successfully",
      appointment,
    });
  } catch (error) {
    console.log("Reschedule Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAvailableSlots,
  getMyAppointments,
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
};
