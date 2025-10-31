const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const {
  createService,
  getServices,
  updateService,
  deleteService,
} = require("../controllers/serviceController");

// salon staff or admin can manage services
router.post("/", authenticate, createService);
router.get("/", getServices);
router.patch("/:id", authenticate, updateService);
router.delete("/:id", authenticate, deleteService);

module.exports = router;
