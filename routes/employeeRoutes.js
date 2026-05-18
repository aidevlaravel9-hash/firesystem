const express = require("express");
const router = express.Router();

const { createEmployee, employeeList, getEmployeeById, updateEmployee, deleteEmployee, updateEmployeeStatus } = require("../controllers/employeeController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// ✅ Create Employee
router.post(
  "/create_employee",
  authMiddleware,
  upload.single("uploadsignatureimg"),
  createEmployee
);

// ✅ Employee List (search + role filter + pagination)
router.post("/employeelist", authMiddleware, employeeList);

// ✅ Get Employee By ID
router.post("/get_employee_by_id", authMiddleware, getEmployeeById);

// ✅ Update Employee
router.post(
  "/update_employee",
  authMiddleware,
  upload.single("uploadsignatureimg"),
  updateEmployee
);

// ✅ Delete Employee
router.post("/delete_employee", authMiddleware, deleteEmployee);

// ✅ Update Employee Status
router.post("/update_employee_status", authMiddleware, updateEmployeeStatus);

module.exports = router;
