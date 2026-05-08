const sequelize = require("../config/db");

// ✅ Get All Countries
const getCountries = async (req, res) => {
  try {
    const countries = await sequelize.query(
      `SELECT countryid, country_name FROM countrymaster ORDER BY country_name ASC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json({ success: true, data: countries });
  } catch (error) {
    console.error("Get Countries Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get States — all states, or filtered by countryid if provided
const getStates = async (req, res) => {
  try {
    const { countryid } = req.body;

    let states;
    if (countryid) {
      states = await sequelize.query(
        `SELECT iStateId , strStateName FROM statemaster WHERE countryid = :countryid ORDER BY strStateName ASC`,
        {
          replacements: { countryid },
          type: sequelize.QueryTypes.SELECT,
        }
      );
    } else {
      states = await sequelize.query(
        `SELECT iStateId, strStateName FROM statemaster ORDER BY strStateName ASC`,
        { type: sequelize.QueryTypes.SELECT }
      );
    }

    res.json({ success: true, data: states });
  } catch (error) {
    console.error("Get States Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Cities — all cities, or filtered by stateid if provided
const getCities = async (req, res) => {
  try {
    const { stateid } = req.body;

    let cities;
    if (stateid) {
      cities = await sequelize.query(
        `SELECT iCityId, strCityName FROM citymaster WHERE iStateId = :stateid ORDER BY strCityName ASC`,
        {
          replacements: { stateid },
          type: sequelize.QueryTypes.SELECT,
        }
      );
    } else {
      cities = await sequelize.query(
        `SELECT iCityId, strCityName FROM citymaster ORDER BY strCityName ASC`,
        { type: sequelize.QueryTypes.SELECT }
      );
    }

    res.json({ success: true, data: cities });
  } catch (error) {
    console.error("Get Cities Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCountries, getStates, getCities };
