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
    defaultValue: {}, // Example: { mon: "09:00-17:00", tue: "10:00-18:00" }
  },
});


module.exports = StaffProfile;
