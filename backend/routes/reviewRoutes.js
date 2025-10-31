const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const {
  addReview,
  respondToReview,
  getServiceReviews,
} = require("../controllers/reviewController");

// ✅ Customer adds review
router.post("/", authenticate, addReview);

// ✅ Staff responds to review
router.put("/:reviewId/respond", authenticate, respondToReview);

// ✅ Get all reviews for a Service (Public)
router.get("/service/:serviceId", getServiceReviews);

module.exports = router;
