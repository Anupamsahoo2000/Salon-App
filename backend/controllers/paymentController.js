const { Appointment, Service, User } = require("../models");
const { Cashfree, CFEnvironment } = require("cashfree-pg");

const cashfree = new Cashfree(
  CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

const createPaymentOrder = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const userId = req.user.id;

    const appointment = await Appointment.findOne({
      where: { id: appointmentId, customerId: userId },
      include: [{ model: Service }, { model: User, as: "customer" }],
    });

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    const orderId = "ORD_" + Date.now();

    const orderData = {
      order_amount: Number(appointment.Service.price),
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: userId,
        customer_email: appointment.customer.email,
        customer_phone: appointment.customer.phone || "9999999999",
      },
      order_meta: {
        return_url: `${process.env.APP_URL}/payment-success?order_id=${orderId}`,
      },
    };

    const cfResponse = await cashfree.orders.create(orderData);

    appointment.paymentOrderId = orderId;
    appointment.paymentStatus = "pending";
    await appointment.save();

    return res.status(200).json({
      message: "Payment order created",
      orderData: cfResponse.data,
    });
  } catch (error) {
    console.error(
      "Cashfree Order Error:",
      error.response?.data || error.message
    );
    res.status(500).json({ message: "Payment initiation failed" });
  }
};

const paymentWebhook = async (req, res) => {
  try {
    const event = req.body;

    const { order_id, order_status } = event.data;

    const appointment = await Appointment.findOne({
      where: { paymentOrderId: order_id },
      include: [{ model: Service }, { model: User, as: "customer" }],
    });

    if (!appointment) return res.sendStatus(200);

    if (order_status === "PAID") {
      appointment.paymentStatus = "success";
      appointment.status = "booked";
    } else {
      appointment.paymentStatus = "failed";
    }

    await appointment.save();
    return res.sendStatus(200); // ✅ Acknowledge webhook
  } catch (error) {
    console.error("Webhook error:", error);
    return res.sendStatus(200);
  }
};

module.exports = { createPaymentOrder, paymentWebhook };
