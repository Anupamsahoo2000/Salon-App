const { Review, Appointment, Service, User } = require("../models");

// ✅ Customer Adds Review
const addReview = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;
    const customerId = req.user.userId;

    if (req.user.role !== "customer") {
      return res
        .status(403)
        .json({ message: "Access denied. Customers only." });
    }

    // ✅ Must include "as: 'service'" to match your alias in models/index.js
    const appointment = await Appointment.findOne({
      where: { id: appointmentId, customerId },
      include: [{ model: Service, as: "service" }],
    });

    if (!appointment)
      return res.status(404).json({ message: "Invalid Appointment" });

    if (appointment.status !== "completed")
      return res
        .status(400)
        .json({ message: "Review allowed only after completion" });

    // ✅ Prevent duplicate review
    const exists = await Review.findOne({ where: { appointmentId } });
    if (exists)
      return res.status(400).json({ message: "Review already submitted" });

    const review = await Review.create({
      rating,
      comment,
      customerId,
      serviceId: appointment.serviceId,
      appointmentId,
    });

    res.status(201).json({ message: "Review added successfully ✅", review });
  } catch (error) {
    console.error("💥 Add Review Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Staff Respond to Review
const respondToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    if (req.user.role !== "staff") {
      return res.status(403).json({ message: "Access denied. Staff only." });
    }

    const review = await Review.findByPk(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    review.staffResponse = response;
    await review.save();

    res.status(200).json({ message: "Response added", review });
  } catch (error) {
    console.log("Response Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Get Reviews for a service (Public)
const getServiceReviews = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const reviews = await Review.findAll({
      where: { serviceId },
      include: [
        { model: User, attributes: ["name"] },
        { model: Service, attributes: ["name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ reviews });
  } catch (error) {
    console.log("Get Reviews Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Admin: Get All Reviews (All services)
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      include: [
        { model: User, attributes: ["name"] },
        { model: Service, attributes: ["name"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Get All Reviews Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Admin: Delete Review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await Review.destroy({ where: { id } });
    res.status(200).json({ message: "Review deleted" });
  } catch (error) {
    console.error("Delete Review Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Get all reviews written by logged-in customer
const getMyReviews = async (req, res) => {
  try {
    const customerId = req.user.userId;

    const reviews = await Review.findAll({
      where: { customerId },
      include: [
        { model: Service, attributes: ["name"], as: "service" },
        { model: Appointment, attributes: ["appointmentDate", "status"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ reviews });
  } catch (error) {
    console.error("💥 Get My Reviews Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  addReview,
  respondToReview,
  getServiceReviews,
  getAllReviews,
  deleteReview,
  getMyReviews,
};
