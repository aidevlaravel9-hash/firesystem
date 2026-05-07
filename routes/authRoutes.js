const express = require("express");
const router = express.Router();

const {
  register,
  adminLogin,
  getProfile,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// ✅ Register
router.post("/register", register);

// ✅ Admin Login
router.post("/Adminlogin", adminLogin);

// ✅ Profile (protected)
router.post("/profile", authMiddleware, getProfile);

module.exports = router;
