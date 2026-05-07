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

    if (!name || !email || !mobilenumber || !role_id) {
      await t.rollback();
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

    const plainPassword = `${name.toLowerCase()}@123`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    await sequelize.query(
      `INSERT INTO users
       (name, role_id, email, mobile_number, postcode, address,
        countryid, stateid, cityid, uploadsignatureimg, password,createdAt)
       VALUES
       (:name, :role_id, :email, :mobilenumber, :postcode, :address,
        :countryid, :stateid, :cityid, :uploadsignatureimg, :password, NOW())`,
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
          password: hashedPassword,
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

module.exports = { createEmployee };
