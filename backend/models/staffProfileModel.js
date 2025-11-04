const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const StaffProfile = sequelize.define("StaffProfile", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  specialization: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  workingHours: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      monday: "10:00-18:00",
      tuesday: "10:00-18:00",
      wednesday: "10:00-18:00",
      thursday: "10:00-18:00",
      friday: "10:00-18:00",
      saturday: "10:00-18:00",
    }, // Example: { mon: "09:00-17:00", tue: "10:00-18:00" }
  },
});

module.exports = StaffProfile;
