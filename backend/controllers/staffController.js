const { User, Service, StaffProfile, Appointment } = require("../models");

const createStaffProfile = async (req, res) => {
  try {
    const { userId, specialization } = req.body;

    const user = await User.findByPk(userId);
    if (!user || user.role !== "staff")
      return res.status(403).json({ message: "Invalid staff user" });

    const profile = await StaffProfile.create({
      userId,
      specialization,
      workingHours: {
        monday: "10:00-18:00",
        tuesday: "10:00-18:00",
        wednesday: "10:00-18:00",
        thursday: "10:00-18:00",
        friday: "10:00-18:00",
        saturday: "10:00-18:00",
      },
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
    if (!req.user || req.user.role !== "admin") {
      res.status(403).json({ message: "Access denied: Admins only" });
      return false;
    }

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
    const staffProfiles = await StaffProfile.findAll({
      include: [
        {
          association: "user",
          attributes: ["id", "name", "email", "role"],
          where: { role: "staff" }, // ✅ Only staff users
        },
        {
          association: "services",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
        {
          association: "staffAppointments",
          include: [
            {
              association: "service",
              attributes: ["id", "name"],
            },
            {
              association: "customer",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    return res.status(200).json({ staff: staffProfiles }); // ✅ return staff key
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { createStaffProfile, assignServicesToStaff, getAllStaff };
