const express = require("express");
const router = express.Router();

const {
  register,
  adminLogin,
  getProfile,
  updateProfile,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const uploadProfile = require("../middleware/profileUpload");

// ✅ Register
router.post("/register", register);

// ✅ Admin Login
router.post("/Adminlogin", adminLogin);

// ✅ Profile (protected)
router.post("/profile", authMiddleware, getProfile);

// ✅ Update Profile (with image upload)
router.post("/updateProfile", authMiddleware, uploadProfile.single("profile_image"), updateProfile);


module.exports = router;
