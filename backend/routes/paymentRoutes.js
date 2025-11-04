// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const {
  createPaymentOrder,
  verifyPayment,
  paymentWebhook,
} = require("../controllers/paymentController");

router.post("/create-order", authenticate, createPaymentOrder);
router.get("/verify", verifyPayment);
router.post("/webhook", express.json(), paymentWebhook);

module.exports = router;
