const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const {
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  rescheduleAppointment,
  cancelAppointment,
} = require("../controllers/appointmentController");

const router = express.Router();

router.get("/slots", getAvailableSlots);
router.post("/book", authenticate, bookAppointment);
router.get("/my-appointments", authenticate, getMyAppointments);
router.patch("/reschedule/:id", authenticate, rescheduleAppointment);
router.patch("/cancel/:id", authenticate, cancelAppointment);

module.exports = router;
