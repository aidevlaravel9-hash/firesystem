const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const authMiddleware = require("../middleware/authMiddleware");
const sequelize = require("../config/db");
const upload = require("../middleware/uploadMiddleware");

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
router.post("/permissionlist", authMiddleware, async (req, res) => {
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
router.post("/CreateRole", authMiddleware, async (req, res) => {
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

// ==============================
// ✅ Role List ===========
// ==============================
router.post("/rolelist", authMiddleware, async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      permission_search = null,
    } = req.body;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    let whereConditions = "WHERE 1=1";

    if (search && search.trim() !== "") {
      whereConditions += ` AND r.name LIKE :search`;
    }

    if (permission_search !== null && permission_search !== "") {
      whereConditions += ` AND r.id IN (
        SELECT role_id FROM role_permissions 
        WHERE permission_id = :permission_search
      )`;
    }

    // ✅ STEP 1: Get ROLE IDs (pagination applied here)
    const rolesList = await sequelize.query(
      `SELECT r.id, r.name
       FROM roles r
       ${whereConditions}
       ORDER BY r.id ASC
       LIMIT :limit OFFSET :offset`,
      {
        replacements: {
          search: `%${search}%`,
          permission_search: Number(permission_search),
          limit,
          offset,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (rolesList.length === 0) {
      return res.json({
        success: true,
        page,
        limit,
        total: 0,
        data: [],
      });
    }

    const roleIds = rolesList.map((r) => r.id);

    // ✅ STEP 2: Get ALL permissions for those roles
    const permissionsData = await sequelize.query(
      `SELECT 
          r.id AS role_id,
          r.name AS role_name,
          p.permission_id,
          p.permission_name,
          rp.read,
          rp.write
       FROM roles r
       LEFT JOIN role_permissions rp 
         ON r.id = rp.role_id
       LEFT JOIN permission p 
         ON p.permission_id = rp.permission_id
       WHERE r.id IN (:roleIds)
       ORDER BY r.id ASC`,
      {
        replacements: { roleIds },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // ✅ Count total roles
    const countResult = await sequelize.query(
      `SELECT COUNT(*) as total
       FROM roles r
       ${whereConditions}`,
      {
        replacements: {
          search: `%${search}%`,
          permission_search: Number(permission_search),
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const total = countResult[0].total;

    // ✅ Grouping
    const groupedRoles = {};

    permissionsData.forEach((row) => {
      if (!groupedRoles[row.role_id]) {
        groupedRoles[row.role_id] = {
          role_id: row.role_id,
          role_name: row.role_name,
          permissions: [],
        };
      }

      if (row.permission_id) {
        groupedRoles[row.role_id].permissions.push({
          permission_id: row.permission_id,
          permission_name: row.permission_name,
          read: row.read,
          write: row.write,
        });
      }
    });

    res.json({
      success: true,
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      data: Object.values(groupedRoles),
    });
  } catch (error) {
    console.error("Role List Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==============================
// ✅ Delete Role (POST API)
// ==============================
router.post("/deleterole", authMiddleware, async (req, res) => {
  const { role_id } = req.body;

  if (!role_id) {
    return res.status(400).json({
      success: false,
      message: "role_id is required",
    });
  }

  const t = await sequelize.transaction();

  try {
    // ✅ Check role exists
    const [role] = await sequelize.query(
      `SELECT id FROM roles WHERE id = :role_id`,
      {
        replacements: { role_id },
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (!role) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // ✅ Delete permissions first
    await sequelize.query(
      `DELETE FROM role_permissions WHERE role_id = :role_id`,
      { replacements: { role_id }, transaction: t }
    );

    // ✅ Delete role
    await sequelize.query(`DELETE FROM roles WHERE id = :role_id`, {
      replacements: { role_id },
      transaction: t,
    });

    await t.commit();

    res.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("Delete Role Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==============================
// ✅ Get Role By ID (Edit API)
// ==============================
router.post("/getRoleById", authMiddleware, async (req, res) => {
  const { role_id } = req.body;

  try {
    if (!role_id) {
      return res.status(400).json({
        success: false,
        message: "role_id is required",
      });
    }

    // ✅ Get role
    const [role] = await sequelize.query(
      `SELECT id, name 
       FROM roles 
       WHERE id = :role_id`,
      {
        replacements: { role_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // ✅ Get permissions
    const permissions = await sequelize.query(
      `SELECT 
          p.permission_id,
          p.permission_name,
          rp.read,
          rp.write
       FROM role_permissions rp
       JOIN permission p 
         ON p.permission_id = rp.permission_id
       WHERE rp.role_id = :role_id`,
      {
        replacements: { role_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      data: {
        role,
        permissions,
      },
    });
  } catch (error) {
    console.error("Get Role Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================================
// ✅ Update Role + Permissions API
// ==================================
router.post("/updateRole", authMiddleware, async (req, res) => {
  const { role_id, rolename, permissions } = req.body;
  const t = await sequelize.transaction();

  try {
    // ✅ Validation
    if (!role_id || !rolename || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "role_id, rolename and permissions required",
      });
    }

    // ✅ Check role exists
    const [existingRole] = await sequelize.query(
      `SELECT id FROM roles WHERE id = :role_id`,
      {
        replacements: { role_id },
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (!existingRole) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // ✅ Check duplicate name (exclude current role)
    const [duplicate] = await sequelize.query(
      `SELECT id FROM roles 
       WHERE name = :rolename AND id != :role_id`,
      {
        replacements: { rolename, role_id },
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (duplicate) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Role name already exists",
      });
    }

    // ✅ Update role name
    await sequelize.query(
      `UPDATE roles 
       SET name = :rolename, updated_at = NOW()
       WHERE id = :role_id`,
      {
        replacements: { rolename, role_id },
        transaction: t,
      }
    );

    // ✅ DELETE old permissions
    await sequelize.query(
      `DELETE FROM role_permissions WHERE role_id = :role_id`,
      {
        replacements: { role_id },
        transaction: t,
      }
    );

    // ✅ INSERT new permissions
    if (permissions.length > 0) {
      const values = permissions
        .map(
          (p) =>
            `(${role_id}, ${Number(p.permissionid)}, ${Number(
              p.read
            )}, ${Number(p.write)}, NOW(), NOW())`
        )
        .join(", ");

      await sequelize.query(
        `INSERT INTO role_permissions
         (role_id, permission_id, \`read\`, \`write\`, created_at, updated_at)
         VALUES ${values}`,
        { transaction: t }
      );
    }

    await t.commit();

    res.json({
      success: true,
      message: "Role updated successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("Update Role Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =================================
// ✅ Create Employee API
// =================================
router.post(
  "/create_employee",
  authMiddleware,
  upload.single("uploadsignatureimg"),
  async (req, res) => {
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

      // Convert empty strings to NULL also
      name = name || null;
      role_id = role_id || null;
      email = email || null;
      mobilenumber = mobilenumber || null;
      postcode = postcode || null;
      address = address || null;
      countryid = countryid || null;
      stateid = stateid || null;
      cityid = cityid || null;

      // ✅ Required validation
      if (!name || !email || !mobilenumber || !role_id) {
        return res.status(400).json({
          success: false,
          message: "Required fields missing",
        });
      }

      // ✅ Check email exists
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
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      // ✅ Image
      const imagePath = file ? file.filename : null;

      // ✅ Insert
      await sequelize.query(
        `INSERT INTO users
        (name, role_id, email, mobilenumber, postcode, address,
         countryid, stateid, cityid, uploadsignatureimg,
         created_at, updated_at)
        VALUES
        (:name, :role_id, :email, :mobilenumber, :postcode, :address,
         :countryid, :stateid, :cityid, :uploadsignatureimg,
         NOW(), NOW())`,
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

      res.json({
        success: true,
        message: "Employee created successfully",
      });
    } catch (error) {
      await t.rollback();
      console.error("Create Employee Error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;
