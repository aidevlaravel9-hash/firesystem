const express = require("express");
const router = express.Router();

const {
  getCountries,
  getStates,
  getCities,
} = require("../controllers/locationController");

// ✅ Country List
router.post("/countrylist", getCountries);

// ✅ State List — pass ?countryid=1 to filter, or no param for all states
router.post("/statelist", getStates);

// ✅ City List — pass ?stateid=1 to filter, or no param for all cities
router.post("/citylist", getCities);

module.exports = router;
