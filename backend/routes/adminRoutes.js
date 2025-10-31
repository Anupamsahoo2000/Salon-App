const express = require("express");
const {
  getCustomers,
  updateCustomer,
  getAllAppointments,
  updateAppointmentStatus,
  deleteAppointment,
} = require("../controllers/adminController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ User Management
router.get("/customers", authenticate, getCustomers);
router.put("/customers/:customerId", authenticate, updateCustomer);

// ✅ Appointment Management
router.get("/appointments", authenticate, getAllAppointments);
router.put(
  "/appointments/:appointmentId",
  authenticate,
  updateAppointmentStatus
);
router.delete("/appointments/:appointmentId", authenticate, deleteAppointment);

module.exports = router;
