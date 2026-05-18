const express = require("express");
const router  = express.Router();

const {
  createMaintenanceType,
  maintenanceTypeList,
  getMaintenanceTypeById,
  updateMaintenanceTypeStatus,
  updateMaintenanceType,
  deleteMaintenanceType,
  maintenanceTypeDropdownList,
} = require("../controllers/maintenanceTypeController");

const authMiddleware = require("../middleware/authMiddleware");

// ✅ Create Maintenance Type
router.post("/create_maintenance_type", authMiddleware, createMaintenanceType);

// ✅ Maintenance Type List (search + pagination)
router.post("/maintenance_type_list", authMiddleware, maintenanceTypeList);

// ✅ Get Maintenance Type By ID
router.post("/get_maintenance_type_by_id", authMiddleware, getMaintenanceTypeById);

// ✅ Update Maintenance Type Status
router.post("/update_maintenance_type_status", authMiddleware, updateMaintenanceTypeStatus);

// ✅ Update Maintenance Type
router.post("/update_maintenance_type", authMiddleware, updateMaintenanceType);

// ✅ Delete Maintenance Type
router.post("/delete_maintenance_type", authMiddleware, deleteMaintenanceType);

// ✅ Maintenance Type Dropdown List
router.post("/maintenance_type_dropdown_list", authMiddleware, maintenanceTypeDropdownList);

module.exports = router;
