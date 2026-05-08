const sequelize = require("../config/db");

// ✅ Permission List
const permissionList = async (req, res) => {
  console.log("Permission API Hit");

  res.json({
    success: true,
  });
  try {
    const permissions = await sequelize.query(
      `SELECT permission_id, permission_name
       FROM permission
       WHERE isDelete = 0 AND iStatus = 1
       ORDER BY permission_id ASC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json({ success: true, count: permissions.length, data: permissions });
  } catch (error) {
    console.error("Permission API Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Create Role
const createRole = async (req, res) => {
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

    const [result, metadata] = await sequelize.query(
      `INSERT INTO roles (name, guard_name, created_at, updated_at)
       VALUES (:rolename, 'web', NOW(), NOW())`,
      { replacements: { rolename }, transaction: t }
    );

    const roleId = metadata?.insertId ?? result?.insertId ?? result;
    if (!roleId) throw new Error("Failed to retrieve inserted role ID");

    const values = permissions
      .map(
        (p) =>
          `(${roleId}, ${Number(p.permissionid)}, ${Number(p.read)}, ${Number(
            p.write
          )}, NOW(), NOW())`
      )
      .join(", ");

    await sequelize.query(
      `INSERT INTO role_permissions (role_id, permission_id, \`read\`, \`write\`, created_at, updated_at)
       VALUES ${values}`,
      { transaction: t }
    );

    await t.commit();
    res.json({
      success: true,
      message: "Role & permissions saved successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("Create Role Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Role List (paginated)
const roleList = async (req, res) => {
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
        SELECT role_id FROM role_permissions WHERE permission_id = :permission_search
      )`;
    }

    const rolesList = await sequelize.query(
      `SELECT r.id, r.name FROM roles r ${whereConditions}
       ORDER BY r.id ASC LIMIT :limit OFFSET :offset`,
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
      return res.json({ success: true, page, limit, total: 0, data: [] });
    }

    const roleIds = rolesList.map((r) => r.id);

    const permissionsData = await sequelize.query(
      `SELECT r.id AS role_id, r.name AS role_name,
              p.permission_id, p.permission_name, rp.read, rp.write
       FROM roles r
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       LEFT JOIN permission p ON p.permission_id = rp.permission_id
       WHERE r.id IN (:roleIds)
       ORDER BY r.id ASC`,
      { replacements: { roleIds }, type: sequelize.QueryTypes.SELECT }
    );

    const countResult = await sequelize.query(
      `SELECT COUNT(*) as total FROM roles r ${whereConditions}`,
      {
        replacements: {
          search: `%${search}%`,
          permission_search: Number(permission_search),
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const total = countResult[0].total;

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
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Role
const deleteRole = async (req, res) => {
  const { role_id } = req.body;
  if (!role_id) {
    return res
      .status(400)
      .json({ success: false, message: "role_id is required" });
  }

  const t = await sequelize.transaction();
  try {
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
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    await sequelize.query(
      `DELETE FROM role_permissions WHERE role_id = :role_id`,
      {
        replacements: { role_id },
        transaction: t,
      }
    );

    await sequelize.query(`DELETE FROM roles WHERE id = :role_id`, {
      replacements: { role_id },
      transaction: t,
    });

    await t.commit();
    res.json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    await t.rollback();
    console.error("Delete Role Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Role By ID
const getRoleById = async (req, res) => {
  const { role_id } = req.body;
  try {
    if (!role_id) {
      return res
        .status(400)
        .json({ success: false, message: "role_id is required" });
    }

    const [role] = await sequelize.query(
      `SELECT id, name FROM roles WHERE id = :role_id`,
      { replacements: { role_id }, type: sequelize.QueryTypes.SELECT }
    );

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    const permissions = await sequelize.query(
      `SELECT p.permission_id, p.permission_name, rp.read, rp.write
       FROM role_permissions rp
       JOIN permission p ON p.permission_id = rp.permission_id
       WHERE rp.role_id = :role_id`,
      { replacements: { role_id }, type: sequelize.QueryTypes.SELECT }
    );

    res.json({ success: true, data: { role, permissions } });
  } catch (error) {
    console.error("Get Role Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Role
const updateRole = async (req, res) => {
  const { role_id, rolename, permissions } = req.body;
  const t = await sequelize.transaction();
  try {
    if (!role_id || !rolename || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "role_id, rolename and permissions required",
      });
    }

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
      return res
        .status(404)
        .json({ success: false, message: "Role not found" });
    }

    const [duplicate] = await sequelize.query(
      `SELECT id FROM roles WHERE name = :rolename AND id != :role_id`,
      {
        replacements: { rolename, role_id },
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (duplicate) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Role name already exists" });
    }

    await sequelize.query(
      `UPDATE roles SET name = :rolename, updated_at = NOW() WHERE id = :role_id`,
      { replacements: { rolename, role_id }, transaction: t }
    );

    await sequelize.query(
      `DELETE FROM role_permissions WHERE role_id = :role_id`,
      {
        replacements: { role_id },
        transaction: t,
      }
    );

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
        `INSERT INTO role_permissions (role_id, permission_id, \`read\`, \`write\`, created_at, updated_at)
         VALUES ${values}`,
        { transaction: t }
      );
    }

    await t.commit();
    res.json({ success: true, message: "Role updated successfully" });
  } catch (error) {
    await t.rollback();
    console.error("Update Role Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Simple Role Listing — only id and name
const getRoleListing = async (req, res) => {
  try {
    const roles = await sequelize.query(
      `SELECT id, name FROM roles ORDER BY id ASC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json({ success: true, data: roles });
  } catch (error) {
    console.error("Role Listing Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateRoleStatus = async (req, res) => {
  try {
    const { roleid, status } = req.body;

    if (!roleid || status === undefined) {
      return res.status(400).json({
        success: false,
        message: "roleid and status are required",
      });
    }

    const result = await sequelize.query(
      `UPDATE roles 
       SET iStatus = :status 
       WHERE id = :roleid`,
      {
        replacements: { roleid, status },
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    res.json({
      success: true,
      message: "Role status updated successfully",
    });

  } catch (error) {
    console.error("Role Status Update Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  permissionList,
  createRole,
  roleList,
  deleteRole,
  getRoleById,
  updateRole,
  getRoleListing,
  updateRoleStatus,
};
