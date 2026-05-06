const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const authMiddleware = require("../middleware/authMiddleware");
const sequelize = require("../config/db");

const router = express.Router();

// ==========================
// ✅ Register Api========
// ==========================

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exist = await User.findOne({ where: { email } });
    if (exist) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hash = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: hash,
    });
    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================
// ✅ Login =============
// ==========================

router.post("/Adminlogin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({
      where: {
        email,
        role_id: 1, // only admins
      },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Wrong password" });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//==================================
// ✅ Protected API ==========
//==================================
router.post("/profile", authMiddleware, async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ["password"] },
  });

  res.json(user);
});

// ==============================
// ✅ permission API ======
// ==============================
router.post("/permissionlist", async (req, res) => {
  try {
    console.log("Permission API Hit");

    const permissions = await sequelize.query(
      `SELECT 
        permission_id,
        permission_name
      FROM permission
      WHERE isDelete = 0 AND iStatus = 1
      ORDER BY permission_id ASC`,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      count: permissions.length,
      data: permissions,
    });
  } catch (error) {
    console.error("Permission API Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =================================
// ✅ CreateRole API =========
// =================================
router.post("/CreateRole", async (req, res) => {
  const { rolename, permissions } = req.body;
  const t = await sequelize.transaction();
  try {
    if (!rolename || !Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Role name and permissions required",
      });
    }
    const [existingRole] = await sequelize.query(
      `SELECT id FROM roles WHERE name = :rolename LIMIT 1`,
      {
        replacements: { rolename },
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (existingRole) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Role ${rolename} already exists`,
      });
    }

    // ✅ Insert Role
    const [result, metadata] = await sequelize.query(
      `INSERT INTO roles (name, guard_name, created_at, updated_at)
       VALUES (:rolename, 'web', NOW(), NOW())`,
      { replacements: { rolename }, transaction: t }
    );

    // ✅ FIX: Handle both ways Sequelize returns insertId
    const roleId = metadata?.insertId ?? result?.insertId ?? result;

    console.log("roleId =>", roleId); // 👈 verify it's a number, not undefined

    if (!roleId) {
      throw new Error("Failed to retrieve inserted role ID");
    }

    // ✅ Prepare bulk insert values
    const values = permissions
      .map(
        (p) =>
          `(${roleId}, ${Number(p.permissionid)}, ${Number(p.read)}, ${Number(
            p.write
          )}, NOW(), NOW())`
      )
      .join(", ");

    await sequelize.query(
      `INSERT INTO role_permissions
       (role_id, permission_id, \`read\`, \`write\`, created_at, updated_at)
       VALUES ${values}`,
      { transaction: t }
    );

    await t.commit();
    return res.json({
      success: true,
      message: "Role & permissions saved successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
