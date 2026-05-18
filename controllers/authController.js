const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sequelize = require("../config/db");
const { QueryTypes } = require("sequelize");
const User = require("../models/userModel");
const path = require("path");
const fs = require("fs");

// ✅ Register
const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exist = await sequelize.query(
      "SELECT * FROM users WHERE email = ?",
      {
        replacements: [email],
        type: QueryTypes.SELECT,
      }
    );
    if (exist.length > 0) {
      return res.status(400).json({
        message: "User already exists",
      });
    }
    // Password hash
    const hash = await bcrypt.hash(password, 10);
    // Insert user
    await sequelize.query(
      "INSERT INTO users (name, email, password, createdAt) VALUES (?, ?, ?, NOW())",
      {
        replacements: [name, email, hash],
        type: QueryTypes.INSERT,
      }
    );
    res.json({
      message: "User registered successfully",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// ✅ Admin Login
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = await sequelize.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.password,
        u.role_id,
        u.status,
        u.mobile_number,
        r.name AS role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
      LIMIT 1
      `,
      {
        replacements: [email],
        type: QueryTypes.SELECT,
      }
    );

    if (users.length === 0) {
      return res.status(400).json({
        message: "Invalid email",
      });
    }

    const user = users[0];

    // Password check
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({
        message: "Wrong password",
      });
    }
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name, 
        status: user.status,
        mobile_number: user.mobile_number,
      },
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// ✅ Get Profile
const getProfile = async (req, res) => {
  try {
    const users = await sequelize.query(
      `SELECT 
          u.id,
          u.name,
          u.email,
          u.role_id,
          u.createdAt,
          u.updatedAt,
          u.mobile_number,
          u.postcode,
          u.address,
          u.countryid,
          u.stateid,
          u.cityid,
          u.uploadsignatureimg,

          c.country_name,
          s.strStateName,
          ct.strCityName

      FROM users u

      LEFT JOIN countrymaster c 
          ON u.countryid = c.countryid 
          AND c.isDelete = 0
          AND c.iStatus = 1

      LEFT JOIN statemaster s 
          ON u.stateid = s.iStateId 
          AND s.isDelete = 0
          AND s.iStatus = 1

      LEFT JOIN citymaster ct
          ON u.cityid = ct.iCityId
          AND ct.isDelete = 0
          AND ct.iStatus = 1

      WHERE u.id = :userId
      LIMIT 1`,
      {
        replacements: { userId: req.user.id },
        type: QueryTypes.SELECT,
      }
    );

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    return res.status(200).json({
      success: true,
      data: {
        ...user,
        profile_image_url: user.uploadsignatureimg
          ? `${req.protocol}://${req.get("host")}/uploads/profile/${user.uploadsignatureimg}`
          : null,
      },
    });
  } catch (err) {
    console.error("Get Profile Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateProfile = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    let {
      name = null,
      email = null,
      mobile_number = null,
      mobilenumber = null,
      postcode = null,
      address = null,
      countryid = null,
      stateid = null,
      cityid = null,
      role_id=null,
    } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      await t.rollback();
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found",
      });
    }

    // Frontend may send mobilenumber or mobile_number
    mobile_number = mobile_number || mobilenumber || null;

    name = name || null;
    email = email || null;
    postcode = postcode || null;
    address = address || null;
    countryid = countryid || null;
    stateid = stateid || null;
    cityid = cityid || null;
    role_id = role_id || null;


    // Get existing user data
    const [existingUser] = await sequelize.query(
      `SELECT id, email, uploadsignatureimg 
       FROM users 
       WHERE id = :userId 
       LIMIT 1`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (!existingUser) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Email duplicate check (only if email is being changed)
    if (email && email !== existingUser.email) {
      const [emailExists] = await sequelize.query(
        `SELECT id 
         FROM users 
         WHERE email = :email 
         AND id != :userId 
         LIMIT 1`,
        {
          replacements: { email, userId },
          type: QueryTypes.SELECT,
          transaction: t,
        }
      );

      if (emailExists) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    let imagePath = existingUser.uploadsignatureimg || null;

    // Handle new profile image upload
    if (req.file) {
      imagePath = req.file.filename;

      // Delete old image if exists
      if (existingUser.uploadsignatureimg) {
        const oldImagePath = path.join(
          __dirname,
          "../uploads/profile",
          existingUser.uploadsignatureimg
        );

        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (err) {
            console.error("Error deleting old profile image:", err);
          }
        }
      }
    }

    // Update user profile
    await sequelize.query(
      `UPDATE users SET
          name = COALESCE(:name, name),
          email = COALESCE(:email, email),
          mobile_number = COALESCE(:mobile_number, mobile_number),
          postcode = COALESCE(:postcode, postcode),
          address = COALESCE(:address, address),
          countryid = COALESCE(:countryid, countryid),
          stateid = COALESCE(:stateid, stateid),
          cityid = COALESCE(:cityid, cityid),
          uploadsignatureimg = :uploadsignatureimg,
          role_id = COALESCE(:role_id, role_id),
          updatedAt = NOW()
       WHERE id = :userId`,
      {
        replacements: {
          userId,
          name,
          email,
          mobile_number,
          postcode,
          address,
          countryid,
          stateid,
          cityid,
          uploadsignatureimg: imagePath,
          role_id,
        },
        transaction: t,
      }
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile_image: imagePath,
      profile_image_url: imagePath
        ? `${req.protocol}://${req.get("host")}/uploads/profile/${imagePath}`
        : null,
    });
  } catch (error) {
    await t.rollback();

    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { register, adminLogin, getProfile, updateProfile };
