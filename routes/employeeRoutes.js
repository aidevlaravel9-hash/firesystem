const express = require("express");
const router = express.Router();

const { createEmployee } = require("../controllers/employeeController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// ✅ Create Employee
router.post("/create_employee", authMiddleware, upload.single("uploadsignatureimg"), createEmployee);

module.exports = router;
