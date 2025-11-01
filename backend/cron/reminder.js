const cron = require("node-cron");
const { Appointment, User, Service } = require("../models");
const { Op } = require("sequelize");
const { sendEmail } = require("../utils/email");

// ✅ Runs every 15 minutes
cron.schedule("*/15 * * * *", async () => {
  try {
    const now = new Date();
    const hourAhead = new Date(now.getTime() + 60 * 60 * 1000);

    const reminders = await Appointment.findAll({
      where: {
        status: "booked",
        appointmentDate: {
          [Op.between]: [now, hourAhead],
        },
      },
      include: [
        { model: User, as: "customer", attributes: ["email", "name"] },
        { model: Service, as: "service", attributes: ["name"] },
      ],
    });

    for (const apt of reminders) {
      const htmlContent = `
        <h2>Appointment Reminder ⏰</h2>
        <p>Hello ${apt.customer.name},</p>
        <p>This is a reminder for your appointment:</p>
        <p><strong>Service:</strong> ${apt.service.name}</p>
        <p><strong>Time:</strong> ${new Date(
          apt.appointmentDate
        ).toLocaleString()}</p>
        <br>
        <p>We look forward to seeing you 😊</p>
      `;

      await sendEmail(
        apt.customer.email,
        "Upcoming Appointment Reminder",
        htmlContent
      );
    }

    console.log(`🔔 Reminder Cron Ran: ${reminders.length} reminders sent`);
  } catch (error) {
    console.error("Cron Reminder Error:", error.message);
  }
});
