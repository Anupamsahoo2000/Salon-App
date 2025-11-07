const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const {
  addReview,
  respondToReview,
  getServiceReviews,
  getAllReviews,
  deleteReview,
  getMyReviews,
} = require("../controllers/reviewController");

// ✅ Customer adds review
router.post("/", authenticate, addReview);

// ✅ Staff responds to review
router.put("/:reviewId/respond", authenticate, respondToReview);

// ✅ Get all reviews for a Service (Public)
router.get("/service/:serviceId", getServiceReviews);

// ✅ Admin: Get all reviews
router.get("/all", authenticate, getAllReviews);

// ✅ Admin: Delete a review
router.delete("/:id", authenticate, deleteReview);

// ✅ Customer: Get my reviews
// ✅ Get logged-in user's reviews
router.get("/my-reviews", authenticate, getMyReviews);

module.exports = router;
