const { User } = require("../models");

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ["id", "name", "email", "phone", "preferences"],
    });

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, preferences } = req.body;
    const user = await User.findByPk(req.user.userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    await user.update({ name, phone, preferences });

    res.status(200).json({
      message: "Profile updated",
      user,
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getProfile, updateProfile };
