const { Appointment, Payment, User, Service } = require("../models");
const { Cashfree, CFEnvironment } = require("cashfree-pg");
require("dotenv").config();

const cashfree = new Cashfree(
  CFEnvironment.SANDBOX, // Change to PRODUCTION in live mode
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

const APP_URL = process.env.APP_URL || "http://localhost:3000";

// ✅ Create Payment Order
const createPaymentOrder = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const customerId = req.user.userId;

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, customerId },
      include: [{ model: Service, as: "service" }],
    });

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const orderId = "ORD_" + Date.now();

    const payload = {
      order_id: orderId,
      order_amount: appointment.service.price,
      order_currency: "INR",
      customer_details: {
        customer_id: String(customerId),
        customer_email: req.user.email || "test@example.com",
        customer_phone: req.user.phone || "9999999999",
      },
      order_meta: {
        return_url: `${APP_URL}/payment/verify?order_id=${orderId}&appointmentId=${appointmentId}`,
      },
    };

    const response = await cashfree.PGCreateOrder(payload);

    // ✅ Create Payment Record Initially as Pending
    await Payment.create({
      orderId,
      appointmentId,
      userId: customerId,
      amount: appointment.service.price,
      status: "pending",
    });

    appointment.paymentOrderId = orderId;
    appointment.paymentStatus = "pending";
    await appointment.save();

    return res.json({
      success: true,
      paymentSessionId: response.data.payment_session_id,
    });
  } catch (err) {
    console.error("💥 Create Order Error:", err.response?.data || err.message);
    return res
      .status(500)
      .json({ success: false, message: "Payment initialization failed" });
  }
};

// ✅ Verify After Redirect
const verifyPayment = async (req, res) => {
  try {
    const { order_id, appointmentId } = req.query;

    const result = await cashfree.PGFetchOrder(order_id);
    const status = result.data.order_status;
    const txnId = result.data.cf_order_id || null;

    const payment = await Payment.findOne({ where: { orderId: order_id } });
    const appointment = await Appointment.findByPk(appointmentId);

    if (!payment || !appointment)
      return res.redirect(`${APP_URL}/profile.html`);

    if (status === "PAID" || status === "SUCCESS") {
      payment.status = "success";
      payment.transactionId = txnId;
      appointment.paymentStatus = "success";
      appointment.status = "booked";
    } else {
      payment.status = "failed";
      appointment.paymentStatus = "failed";
      appointment.status = "cancelled";
    }

    await payment.save();
    await appointment.save();

    return res.redirect(`${APP_URL}/profile.html`);
  } catch (err) {
    console.error("💥 Verify Error:", err);
    return res.status(500).send("Payment verification failed");
  }
};

// ✅ Webhook → Auto Update DB (Highly Recommended)
const paymentWebhook = async (req, res) => {
  try {
    const event = req.body;

    const orderId = event?.data?.order?.order_id;
    const status = event?.data?.order?.order_status;
    const txnId = event?.data?.payment?.cf_payment_id || null;

    if (!orderId) return res.sendStatus(200);

    const payment = await Payment.findOne({ where: { orderId } });
    if (!payment) return res.sendStatus(200);

    const appointment = await Appointment.findByPk(payment.appointmentId);
    if (!appointment) return res.sendStatus(200);

    if (status === "PAID" || status === "SUCCESS") {
      payment.status = "success";
      payment.transactionId = txnId;
      appointment.paymentStatus = "success";
      appointment.status = "booked";
    } else {
      payment.status = "failed";
      appointment.paymentStatus = "failed";
      appointment.status = "cancelled";
    }

    await payment.save();
    await appointment.save();
    console.log("✅ Webhook updated payment + appointment");

    return res.sendStatus(200);
  } catch (err) {
    console.error("💥 Webhook Error:", err);
    return res.sendStatus(200);
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  paymentWebhook,
};
