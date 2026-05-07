const sequelize = require("../config/db");

// ✅ Create Employee
const createEmployee = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let {
      name = null,
      role_id = null,
      email = null,
      mobilenumber = null,
      postcode = null,
      address = null,
      countryid = null,
      stateid = null,
      cityid = null,
    } = req.body;

    const file = req.file;

    // Convert empty strings to null
    name = name || null;
    role_id = role_id || null;
    email = email || null;
    mobilenumber = mobilenumber || null;
    postcode = postcode || null;
    address = address || null;
    countryid = countryid || null;
    stateid = stateid || null;
    cityid = cityid || null;

    if (!name || !email || !mobilenumber || !role_id) {
      return res
        .status(400)
        .json({ success: false, message: "Required fields missing" });
    }

    const [existingUser] = await sequelize.query(
      `SELECT id FROM users WHERE email = :email LIMIT 1`,
      {
        replacements: { email },
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (existingUser) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    const imagePath = file ? file.filename : null;

    await sequelize.query(
      `INSERT INTO users
       (name, role_id, email, mobilenumber, postcode, address,
        countryid, stateid, cityid, uploadsignatureimg, created_at, updated_at)
       VALUES
       (:name, :role_id, :email, :mobilenumber, :postcode, :address,
        :countryid, :stateid, :cityid, :uploadsignatureimg, NOW(), NOW())`,
      {
        replacements: {
          name,
          role_id,
          email,
          mobilenumber,
          postcode,
          address,
          countryid,
          stateid,
          cityid,
          uploadsignatureimg: imagePath,
        },
        transaction: t,
      }
    );

    await t.commit();
    res.json({ success: true, message: "Employee created successfully" });
  } catch (error) {
    await t.rollback();
    console.error("Create Employee Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createEmployee };
