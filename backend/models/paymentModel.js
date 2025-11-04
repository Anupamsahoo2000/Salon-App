const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Payment = sequelize.define("Payment", {
  id: {
    type: DataTypes.UUID, // ✅ Use UUID
    defaultValue: DataTypes.UUIDV4, // ✅ Auto-generate unique id
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  appointmentId: {
    type: DataTypes.UUID, // ✅ If Appointment uses UUID
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID, // ✅ If User uses UUID
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: "INR",
  },
  status: {
    type: DataTypes.ENUM("pending", "success", "failed"),
    defaultValue: "pending",
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Payment;
