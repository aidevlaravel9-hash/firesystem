const express = require("express");
const router  = express.Router();

const {
  createBuilding,
  buildingList,
  getBuildingById,
  updateBuildingStatus,
  updateBuilding,
  deleteBuilding,
  generateQRCode,
  printQRCode
} = require("../controllers/buildingController");

const authMiddleware = require("../middleware/authMiddleware");

// ✅ Create Building
router.post("/create_building", authMiddleware, createBuilding);

// ✅ Building List (search + filter + pagination)
router.post("/buildinglist", authMiddleware, buildingList);

// ✅ Get Building By ID
router.post("/get_building_by_id", authMiddleware, getBuildingById);

// ✅ Update Building Status
router.post("/update_building_status", authMiddleware, updateBuildingStatus);

// ✅ Update Building
router.post("/update_building", authMiddleware, updateBuilding);

// ✅ Delete Building
router.post("/delete_building", authMiddleware, deleteBuilding);

// ✅ Generate QR Code
router.post("/generate_qrcode", authMiddleware, generateQRCode);

// ✅ Print QR Code
router.post("/print_qrcode", authMiddleware, printQRCode);

module.exports = router;
