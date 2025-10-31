const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const StaffService = sequelize.define("StaffService", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
});

module.exports = StaffService;
