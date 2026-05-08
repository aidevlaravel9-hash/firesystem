const express = require("express");
const router = express.Router();

const {
  permissionList,
  createRole,
  roleList,
  deleteRole,
  getRoleById,
  updateRole,
  getRoleListing,
  updateRoleStatus,
} = require("../controllers/roleController");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Permission List
router.post("/permissionlist", authMiddleware, permissionList);

// ✅ Create Role
router.post("/CreateRole", authMiddleware, createRole);

// ✅ Role List
router.post("/rolelist", authMiddleware, roleList);

// ✅ Delete Role
router.post("/deleterole", authMiddleware, deleteRole);

// ✅ Get Role By ID
router.post("/getRoleById", authMiddleware, getRoleById);

// ✅ Update Role
router.post("/updateRole", authMiddleware, updateRole);

// ✅ Update Role states
router.post("/updateRoleStatus", authMiddleware, updateRoleStatus);

// ✅ Role Listing (id & name only)
router.post("/rolelisting", getRoleListing);

module.exports = router;
