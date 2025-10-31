const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Review = sequelize.define("Review", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  staffResponse: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = Review;
