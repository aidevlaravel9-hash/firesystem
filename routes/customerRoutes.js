const express = require("express");
const router  = express.Router();

const {
  createCustomer,
  customerList,
  updateCustomerStatus,
  deleteCustomer,
} = require("../controllers/customerController");

const authMiddleware   = require("../middleware/authMiddleware");
const { handleCustomerUpload } = require("../middleware/customerUploadMiddleware");

// ✅ Create Customer
router.post("/create_customer", authMiddleware, handleCustomerUpload, createCustomer);

// ✅ Customer List (search + country filter + pagination)
router.post("/customerlist", authMiddleware, customerList);

// ✅ Update Customer Status
router.post("/update_customer_status", authMiddleware, updateCustomerStatus);

// ✅ Delete Customer
router.post("/delete_customer", authMiddleware, deleteCustomer);

module.exports = router;
