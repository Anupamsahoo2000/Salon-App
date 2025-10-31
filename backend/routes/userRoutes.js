const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { getProfile, updateProfile } = require("../controllers/userController");

router.get("/me", authenticate, getProfile);
router.patch("/me", authenticate, updateProfile);

module.exports = router;
