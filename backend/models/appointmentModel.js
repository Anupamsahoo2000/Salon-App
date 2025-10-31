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
    type: DataTypes.ENUM("booked", "cancelled", "completed"),
    defaultValue: "booked",
  },
});





module.exports = Appointment;
