const express = require("express");
const router  = express.Router();

const {
  createCustomer,
  customerList,
  getCustomerById,
  updateCustomerStatus,
  updateCustomer,
  deleteCustomer,
  customerDropdownList,
} = require("../controllers/customerController");

const authMiddleware   = require("../middleware/authMiddleware");
const { handleCustomerUpload } = require("../middleware/customerUploadMiddleware");

// ✅ Create Customer
router.post("/create_customer", authMiddleware, handleCustomerUpload, createCustomer);

// ✅ Customer List (search + country filter + pagination)
router.post("/customerlist", authMiddleware, customerList);

// ✅ Get Customer By ID
router.post("/get_customer_by_id", authMiddleware, getCustomerById);

// ✅ Update Customer Status
router.post("/update_customer_status", authMiddleware, updateCustomerStatus);

// ✅ Update Customer
router.post("/update_customer", authMiddleware, handleCustomerUpload, updateCustomer);

// ✅ Delete Customer
router.post("/delete_customer", authMiddleware, deleteCustomer);

router.post("/customerDropdownList", authMiddleware,   customerDropdownList);



module.exports = router;
