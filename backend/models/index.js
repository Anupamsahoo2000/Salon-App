const sequelize = require("../config/db");

// Import Models
const User = require("./userModel");
const StaffProfile = require("./staffProfileModel");
const Service = require("./serviceModel");
const StaffService = require("./staffServiceModel");
const Appointment = require("./appointmentModel");
const Review = require("./reviewModel");
const Payment = require("./paymentModel");

// ------------------------------------
// ✅ Associations Setup
// ------------------------------------

// ✅ 1️⃣ User ↔ StaffProfile (One-to-One)
User.hasOne(StaffProfile, {
  foreignKey: "userId",
  as: "staffProfile",
  onDelete: "CASCADE",
});
StaffProfile.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// ✅ 2️⃣ StaffProfile ↔ Service (Many-to-Many)
StaffProfile.belongsToMany(Service, {
  through: StaffService,
  foreignKey: "staffProfileId",
  as: "services",
});
Service.belongsToMany(StaffProfile, {
  through: StaffService,
  foreignKey: "serviceId",
  as: "staff",
});

// ✅ 3️⃣ Appointment Associations
User.hasMany(Appointment, {
  foreignKey: "customerId",
  as: "appointments",
});
Appointment.belongsTo(User, {
  foreignKey: "customerId",
  as: "customer",
});

StaffProfile.hasMany(Appointment, {
  foreignKey: "staffProfileId",
  as: "staffAppointments",
});
Appointment.belongsTo(StaffProfile, {
  foreignKey: "staffProfileId",
  as: "staff",
});

Service.hasMany(Appointment, {
  foreignKey: "serviceId",
  as: "serviceAppointments",
});
Appointment.belongsTo(Service, {
  foreignKey: "serviceId",
  as: "service",
});

// ✅ Reviews
Review.belongsTo(User, { foreignKey: "customerId" });
Review.belongsTo(Service, { foreignKey: "serviceId" });
Review.belongsTo(Appointment, { foreignKey: "appointmentId" });

User.hasMany(Review, { foreignKey: "customerId" });
Service.hasMany(Review, { foreignKey: "serviceId" });
Appointment.hasOne(Review, { foreignKey: "appointmentId" });

// ✅ Payment Associations
Payment.belongsTo(Appointment, { foreignKey: "appointmentId" });
Payment.belongsTo(User, { foreignKey: "userId" });

Appointment.hasOne(Payment, { foreignKey: "appointmentId" });
User.hasMany(Payment, { foreignKey: "userId" });

// ------------------------------------
// ✅ Export Everything including Payment
// ------------------------------------
module.exports = {
  User,
  StaffProfile,
  Service,
  StaffService,
  Appointment,
  Review,
  Payment,
};
