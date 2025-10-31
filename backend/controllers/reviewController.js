const { Review, Appointment, Service, User } = require("../models");

// ✅ Customer Adds Review
const addReview = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;
    const customerId = req.user.id;

    if (req.user.role !== "customer") {
      return res
        .status(403)
        .json({ message: "Access denied. Customers only." });
    }

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, customerId },
      include: [{ model: Service }],
    });

    if (!appointment)
      return res.status(404).json({ message: "Invalid Appointment" });

    if (appointment.status !== "completed")
      return res
        .status(400)
        .json({ message: "Review allowed after completion only" });

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

    res.status(201).json({ message: "Review added", review });
  } catch (error) {
    console.log("Add Review Error:", error);
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

module.exports = { addReview, respondToReview, getServiceReviews };
