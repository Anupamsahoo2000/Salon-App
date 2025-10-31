const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const {
  createStaffProfile,
  assignServicesToStaff,
  getAllStaff,
} = require("../controllers/staffController");

// Admin-only actions
router.post("/", authenticate, createStaffProfile);
router.post("/assign-services", authenticate, assignServicesToStaff);

// Public: Get service providers for booking
router.get("/", getAllStaff);

module.exports = router;
