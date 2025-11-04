const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const {
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  rescheduleAppointment,
  cancelAppointment,
  getAppointmentById,
  confirmPayment,
} = require("../controllers/appointmentController");

const router = express.Router();

router.get("/slots", getAvailableSlots);
router.get("/my-appointments", authenticate, getMyAppointments);
router.get("/:id", authenticate, getAppointmentById);
router.post("/book", authenticate, bookAppointment);
router.patch("/reschedule/:id", authenticate, rescheduleAppointment);
router.patch("/cancel/:id", authenticate, cancelAppointment);
router.patch("/confirm-payment", authenticate, confirmPayment);

module.exports = router;
