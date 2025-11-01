const { User, Service, StaffProfile, StaffService } = require("../models");

// Create Staff Profile
const createStaffProfile = async (req, res) => {
  try {
    const { userId, specialization, workingHours } = req.body;

    const user = await User.findByPk(userId);
    if (!user || user.role !== "staff")
      return res.status(403).json({ message: "Invalid staff user" });

    const profile = await StaffProfile.create({
      userId,
      specialization,
      workingHours,
    });

    res.status(201).json({ message: "Staff profile created", profile });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Assign services to staff
const assignServicesToStaff = async (req, res) => {
  try {
    const { staffProfileId, serviceIds } = req.body;

    const staffProfile = await StaffProfile.findByPk(staffProfileId);
    if (!staffProfile)
      return res.status(404).json({ message: "Staff profile not found" });

    const services = await Service.findAll({ where: { id: serviceIds } });

    await staffProfile.setServices(services);

    res.status(200).json({ message: "Services assigned to staff", services });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Staff with Assigned Services
const getAllStaff = async (req, res) => {
  try {
    // NOTE: Associations in models/index.js use aliases: StaffProfile.belongsTo(User, { as: 'user' })
    // and StaffProfile.belongsToMany(Service, { as: 'services' }). We must provide the same
    // `as` values when eager-loading via `include` so Sequelize can resolve the associations.
    const staff = await StaffProfile.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role"],
        },
        { model: Service, as: "services" },
      ],
    });

    res.status(200).json({ staff });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createStaffProfile, assignServicesToStaff, getAllStaff };
