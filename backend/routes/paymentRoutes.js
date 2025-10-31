const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const {
  createPaymentOrder,
  paymentWebhook,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-order", authenticate, createPaymentOrder);
router.post("/webhook", paymentWebhook);

module.exports = router;
