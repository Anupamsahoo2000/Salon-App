const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Appointment = sequelize.define("Appointment", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  appointmentDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "booked", "cancelled", "completed"),
    defaultValue: "pending",
  },
  paymentStatus: {
    type: DataTypes.ENUM("pending", "success", "failed", "cancelled"),
    defaultValue: "pending",
  },
  paymentOrderId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Appointment;
