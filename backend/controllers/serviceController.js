const { Service, StaffProfile } = require("../models");

// Create Service
const createService = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      res.status(403).json({ message: "Access denied: Admins only" });
      return false;
    }
    const { name, description, durationMinutes, price } = req.body;

    if (!name || !durationMinutes || !price)
      return res.status(400).json({ message: "Missing required fields" });

    const service = await Service.create({
      name,
      description,
      durationMinutes,
      price,
    });
    return res.status(201).json({ message: "Service created", service });
  } catch (error) {
    console.log("Service Create Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all active services
const getServices = async (req, res) => {
  try {
    const services = await Service.findAll({ where: { isActive: true } });
    res.status(200).json({ services });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Service
const updateService = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      res.status(403).json({ message: "Access denied: Admins only" });
      return false;
    }
    const { id } = req.params;
    const service = await Service.findByPk(id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    await service.update(req.body);
    res.status(200).json({ message: "Service updated", service });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Soft Delete Service
const deleteService = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      res.status(403).json({ message: "Access denied: Admins only" });
      return false;
    }
    const { id } = req.params;
    const service = await Service.findByPk(id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    await service.update({ isActive: false });
    res.status(200).json({ message: "Service deactivated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);

    if (!service) return res.status(404).json({ message: "Service not found" });

    res.json({ service });
  } catch (error) {
    console.error("Service fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getServiceStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id, {
      include: [
        {
          model: StaffProfile,
          as: "staff",
          attributes: ["id", "fullName"],
          through: { attributes: [] },
        },
      ],
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ staff: service.staff });
  } catch (error) {
    console.error("Fetch staff error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  createService,
  getServices,
  updateService,
  deleteService,
  getServiceById,
  getServiceStaff,
};
