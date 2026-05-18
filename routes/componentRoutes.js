const express = require("express");
const router  = express.Router();

const {
  createComponent,
  componentList,
  getComponentById,
  updateComponentStatus,
  updateComponent,
  deleteComponent,
  componentDropdownList,
} = require("../controllers/componentController");

const authMiddleware = require("../middleware/authMiddleware");

// ✅ Create Component
router.post("/create_component", authMiddleware, createComponent);

// ✅ Component List (search + pagination)
router.post("/componentlist", authMiddleware, componentList);

// ✅ Get Component By ID
router.post("/get_component_by_id", authMiddleware, getComponentById);

// ✅ Update Component Status
router.post("/update_component_status", authMiddleware, updateComponentStatus);

// ✅ Update Component
router.post("/update_component", authMiddleware, updateComponent);

// ✅ Delete Component
router.post("/delete_component", authMiddleware, deleteComponent);

// ✅ Component Dropdown List
router.post("/componentDropdownList", authMiddleware, componentDropdownList);

module.exports = router;
