const sequelize = require("../config/db");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// ✅ Create Employee (with optional file upload)
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
      qrcodeaccess = 0,
    } = req.body;

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
    qrcodeaccess = qrcodeaccess !== undefined && qrcodeaccess !== null ? Number(qrcodeaccess) : 1;

    // ✅ Get created_by_id from authenticated user
    const created_by_id = req.user?.id;

    if (!name || !email || !mobilenumber || !role_id) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Required fields missing" });
    }

    if (!created_by_id) {
      await t.rollback();
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: user not found" });
    }

    // ✅ Check if role_id exists (foreign key reference check)
    const [roleExists] = await sequelize.query(
      `SELECT id FROM roles WHERE id = :role_id LIMIT 1`,
      {
        replacements: { role_id },
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (!roleExists) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Invalid role_id: Role does not exist" });
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

    // Handle file upload - check both req.file (form-data) and req.body.uploadsignatureimg (JSON base64)
    let imagePath = null;

    if (req.file) {
      // For form-data upload
      imagePath = req.file.filename;
    } else if (
      req.body.uploadsignatureimg &&
      req.body.uploadsignatureimg !== "null"
    ) {
      // For JSON base64 upload
      const base64Data = req.body.uploadsignatureimg;
      const matches = base64Data.match(
        /^data:image\/([A-Za-z-+\/]+);base64,(.+)$/
      );

      if (matches && matches.length === 3) {
        const imageType = matches[1];
        const imageBuffer = Buffer.from(matches[2], "base64");
        const uniqueName = Date.now() + "." + imageType;
        const uploadPath = path.join(
          __dirname,
          "../uploads/signatures",
          uniqueName
        );

        fs.writeFileSync(uploadPath, imageBuffer);
        imagePath = uniqueName;
      }
    }

    const plainPassword = '123456'; //`${name.toLowerCase()}@123`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    await sequelize.query(
      `INSERT INTO users
       (name, role_id, email, mobile_number, postcode, address,
        countryid, stateid, cityid, uploadsignatureimg, qrcodeaccess, password, created_by_id, createdAt)
       VALUES
       (:name, :role_id, :email, :mobilenumber, :postcode, :address,
        :countryid, :stateid, :cityid, :uploadsignatureimg, :qrcodeaccess, :password, :created_by_id, NOW())`,
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
          qrcodeaccess,
          password: hashedPassword,
          created_by_id,
        },
        transaction: t,
      }
    );

    await t.commit();
    res.json({
      success: true,
      message: "Employee created successfully",
      generatedPassword: plainPassword,
      imagePath: imagePath,
      imageUrl: imagePath
        ? `${req.protocol}://${req.get("host")}/uploads/signatures/${imagePath}`
        : null,
    });
  } catch (error) {
    await t.rollback();
    console.error("Create Employee Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Employee List (with search, role filter & pagination)
const employeeList = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", role_id = null, created_by_id = null } = req.body;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    let whereConditions = "WHERE 1=1";
    const replacements = {};

    if (search && search.trim() !== "") {
      whereConditions += ` AND (
        u.name        LIKE :search OR
        u.email       LIKE :search OR
        u.mobile_number LIKE :search
      )`;
      replacements.search = `%${search.trim()}%`;
    }

    if (role_id !== null && role_id !== "" && role_id !== undefined) {
      whereConditions += ` AND u.role_id = :role_id`;
      replacements.role_id = Number(role_id);
    }

    if (created_by_id !== null && created_by_id !== "" && created_by_id !== undefined) {
      whereConditions += ` AND u.created_by_id = :created_by_id`;
      replacements.created_by_id = Number(created_by_id);
    }

    // Total count
    const countResult = await sequelize.query(
      `SELECT COUNT(*) AS total
       FROM users u
       ${whereConditions}`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );
    const total = countResult[0].total;

    // Paginated data
    const employees = await sequelize.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.mobile_number,
         u.postcode,
         u.address,
         u.status   AS status,
         u.role_id,
         r.name      AS role_name,
         u.countryid,
         co.country_name     AS country_name,
         u.stateid,
         st.strStateName     AS state_name,
         u.cityid,
         ci.strCityName     AS city_name,
         u.uploadsignatureimg,
         u.qrcodeaccess,
         u.createdAt
       FROM users u
       LEFT JOIN roles    r  ON r.id  = u.role_id
       LEFT JOIN countrymaster co ON co.countryid = u.countryid
       LEFT JOIN statemaster    st ON st.iStateId = u.stateid
       LEFT JOIN citymaster    ci ON ci.iCityId = u.cityid
       ${whereConditions}
       ORDER BY u.id DESC
       LIMIT :limit OFFSET :offset`,
      {
        replacements: { ...replacements, limit, offset },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Append full signature URL
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const data = employees.map((emp) => ({
      ...emp,
      signature_url: emp.uploadsignatureimg
        ? `${baseUrl}/uploads/signatures/${emp.uploadsignatureimg}`
        : null,
    }));

    res.json({
      success: true,
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      data,
    });
  } catch (error) {
    console.error("Employee List Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Employee (with optional new signature upload)
const updateEmployee = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let {
      employee_id = null,
      name = null,
      role_id = null,
      email = null,
      mobilenumber = null,
      postcode = null,
      address = null,
      countryid = null,
      stateid = null,
      cityid = null,
      qrcodeaccess = null,
    } = req.body;

    // Convert empty strings to null
    employee_id = employee_id || null;
    name       = name       || null;
    role_id    = role_id    || null;
    email      = email      || null;
    mobilenumber = mobilenumber || null;
    postcode   = postcode   || null;
    address    = address    || null;
    countryid  = countryid  || null;
    stateid    = stateid    || null;
    cityid     = cityid     || null;
    qrcodeaccess = qrcodeaccess !== undefined && qrcodeaccess !== null ? Number(qrcodeaccess) : 1;

    // ✅ Get created_by_id from authenticated user
    const created_by_id = req.user?.id;

    if (!employee_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "employee_id is required" });
    }

    if (!name || !email || !mobilenumber || !role_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    if (!created_by_id) {
      await t.rollback();
      return res.status(401).json({ success: false, message: "Unauthorized: user not found" });
    }

    // ✅ Check if role_id exists (foreign key reference check)
    const [roleExists] = await sequelize.query(
      `SELECT id FROM roles WHERE id = :role_id LIMIT 1`,
      {
        replacements: { role_id },
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (!roleExists) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Invalid role_id: Role does not exist" });
    }

    // Check employee exists
    const [existing] = await sequelize.query(
      `SELECT id, uploadsignatureimg FROM users WHERE id = :employee_id LIMIT 1`,
      { replacements: { employee_id }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );

    if (!existing) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Check email duplicate (exclude current employee)
    const [emailExists] = await sequelize.query(
      `SELECT id FROM users WHERE email = :email AND id != :employee_id LIMIT 1`,
      { replacements: { email, employee_id }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );

    if (emailExists) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Email already used by another employee" });
    }

    // Handle signature image
    let imagePath = existing.uploadsignatureimg; // keep old by default

    if (req.file) {
      // New file uploaded — delete old one if exists
      if (existing.uploadsignatureimg) {
        const oldFilePath = path.join(__dirname, "../uploads/signatures", existing.uploadsignatureimg);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
      imagePath = req.file.filename;
    } else if (req.body.uploadsignatureimg && req.body.uploadsignatureimg !== "null") {
      // Base64 image
      const base64Data = req.body.uploadsignatureimg;
      const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        // Delete old signature
        if (existing.uploadsignatureimg) {
          const oldFilePath = path.join(__dirname, "../uploads/signatures", existing.uploadsignatureimg);
          if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        }
        const imageType   = matches[1];
        const imageBuffer = Buffer.from(matches[2], "base64");
        const uniqueName  = Date.now() + "." + imageType;
        fs.writeFileSync(path.join(__dirname, "../uploads/signatures", uniqueName), imageBuffer);
        imagePath = uniqueName;
      }
    }

    // Build update query with conditional qrcodeaccess update
    let updateQuery = `UPDATE users SET
         name               = :name,
         role_id            = :role_id,
         email              = :email,
         mobile_number      = :mobilenumber,
         postcode           = :postcode,
         address            = :address,
         countryid          = :countryid,
         stateid            = :stateid,
         cityid             = :cityid,
         uploadsignatureimg = :uploadsignatureimg,
         created_by_id      = :created_by_id,
         updatedAt          = NOW()`;

    const replacements = {
      name, role_id, email, mobilenumber, postcode, address,
      countryid, stateid, cityid,
      uploadsignatureimg: imagePath,
      created_by_id,
      employee_id,
    };

    // Only update qrcodeaccess if it's provided
    if (qrcodeaccess !== null) {
      updateQuery = `UPDATE users SET
         name               = :name,
         role_id            = :role_id,
         email              = :email,
         mobile_number      = :mobilenumber,
         postcode           = :postcode,
         address            = :address,
         countryid          = :countryid,
         stateid            = :stateid,
         cityid             = :cityid,
         uploadsignatureimg = :uploadsignatureimg,
         qrcodeaccess       = :qrcodeaccess,
         created_by_id      = :created_by_id,
         updatedAt          = NOW()`;
      replacements.qrcodeaccess = qrcodeaccess;
    }

    updateQuery += ` WHERE id = :employee_id`;

    await sequelize.query(updateQuery, {
      replacements,
      transaction: t,
    });

    await t.commit();
    res.json({
      success: true,
      message: "Employee updated successfully",
      imageUrl: imagePath
        ? `${req.protocol}://${req.get("host")}/uploads/signatures/${imagePath}`
        : null,
    });
  } catch (error) {
    await t.rollback();
    console.error("Update Employee Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Employee
const deleteEmployee = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { employee_id } = req.body;

    if (!employee_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "employee_id is required" });
    }

    const [existing] = await sequelize.query(
      `SELECT id, uploadsignatureimg FROM users WHERE id = :employee_id LIMIT 1`,
      { replacements: { employee_id }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );

    if (!existing) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Delete signature file from disk if exists
    if (existing.uploadsignatureimg) {
      const filePath = path.join(__dirname, "../uploads/signatures", existing.uploadsignatureimg);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await sequelize.query(
      `DELETE FROM users WHERE id = :employee_id`,
      { replacements: { employee_id }, transaction: t }
    );

    await t.commit();
    res.json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    await t.rollback();
    console.error("Delete Employee Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Employee By ID
const getEmployeeById = async (req, res) => {
  try {
    const { employee_id } = req.body;

    if (!employee_id) {
      return res.status(400).json({ success: false, message: "employee_id is required" });
    }

    const [employee] = await sequelize.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.mobile_number,
         u.postcode,
         u.address,
         u.status,
         u.role_id,
         r.name      AS role_name,
         u.countryid,
         co.country_name     AS country_name,
         u.stateid,
         st.strStateName     AS state_name,
         u.cityid,
         ci.strCityName     AS city_name,
         u.uploadsignatureimg,
         u.qrcodeaccess,
         u.created_by_id,
         u.createdAt,
         u.updatedAt
       FROM users u
       LEFT JOIN roles    r  ON r.id  = u.role_id
       LEFT JOIN countrymaster co ON co.countryid = u.countryid
       LEFT JOIN statemaster    st ON st.iStateId = u.stateid
       LEFT JOIN citymaster    ci ON ci.iCityId = u.cityid
       WHERE u.id = :employee_id
       LIMIT 1`,
      {
        replacements: { employee_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Append full signature URL
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const data = {
      ...employee,
      signature_url: employee.uploadsignatureimg
        ? `${baseUrl}/uploads/signatures/${employee.uploadsignatureimg}`
        : null,
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error("Get Employee By ID Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Employee Status (active / inactive)
const updateEmployeeStatus = async (req, res) => {
  try {
    const { employee_id, status } = req.body;

    if (!employee_id || status == undefined || status == "") {
      return res.status(400).json({ success: false, message: "employee_id and status are required" });
    }

    const [existing] = await sequelize.query(
      `SELECT id FROM users WHERE id = :employee_id LIMIT 1`,
      { replacements: { employee_id }, type: sequelize.QueryTypes.SELECT }
    );

    if (!existing) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    await sequelize.query(
      `UPDATE users SET status = :status, updatedAt = NOW() WHERE id = :employee_id`,
      { replacements: { status: Number(status), employee_id } }
    );

    res.json({ success: true, message: "Employee status updated successfully" });
  } catch (error) {
    console.error("Update Employee Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createEmployee, employeeList, getEmployeeById, updateEmployee, deleteEmployee, updateEmployeeStatus };
