const sequelize = require("../config/db");

// ─── 1. Create Component ──────────────────────────────────────────────
const createComponent = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let { component_name = null } = req.body;

    component_name = component_name || null;
    const created_by_id = req.user?.id;

    if (!component_name) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "component_name is required" 
      });
    }

    if (!created_by_id) {
      await t.rollback();
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: user not found" 
      });
    }

    // Duplicate name check
    const [nameExists] = await sequelize.query(
      `SELECT component_id FROM component WHERE component_name = :component_name LIMIT 1`,
      { 
        replacements: { component_name }, 
        type: sequelize.QueryTypes.SELECT, 
        transaction: t 
      }
    );
    if (nameExists) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "Component name already exists" 
      });
    }

    await sequelize.query(
      `INSERT INTO component
         (component_name, created_by_id, created_at)
       VALUES
         (:component_name, :created_by_id, NOW())`,
      {
        replacements: {
          component_name,
          created_by_id,
        },
        transaction: t,
      }
    );

    await t.commit();
    res.json({
      success: true,
      message: "Component created successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("Create Component Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ─── 2. Component List (search + pagination) ─────────────────
const componentList = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.body;

    page  = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const replacements = {};

    if (search && search.trim() !== "") {
      where += ` AND c.component_name LIKE :search`;
      replacements.search = `%${search.trim()}%`;
    }

    // Total count
    const countResult = await sequelize.query(
      `SELECT COUNT(*) AS total FROM component c ${where}`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );
    const total = countResult[0].total;

    // Paginated rows
    const components = await sequelize.query(
      `SELECT
         c.component_id,
         c.component_name,
         c.component_status,
         c.created_by_id,
         u.name AS created_by_name,
         u.role_id,
         c.created_at,
         c.updated_at
       FROM component c
       LEFT JOIN users u ON u.id = c.created_by_id
       ${where}
       ORDER BY c.component_id DESC
       LIMIT :limit OFFSET :offset`,
      {
        replacements: { ...replacements, limit, offset },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      data: components,
    });
  } catch (error) {
    console.error("Component List Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ─── 3. Get Component By ID ───────────────────────────────────────────────────
const getComponentById = async (req, res) => {
  try {
    const { component_id } = req.body;

    if (!component_id) {
      return res.status(400).json({ 
        success: false, 
        message: "component_id is required" 
      });
    }

    const [component] = await sequelize.query(
      `SELECT
         c.component_id,
         c.component_name,
         c.component_status,
         c.created_by_id,
         u.name AS created_by_name,
         c.created_at,
         c.updated_at
       FROM component c
       LEFT JOIN users u ON u.id = c.created_by_id
       WHERE c.component_id = :component_id
       LIMIT 1`,
      {
        replacements: { component_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!component) {
      return res.status(404).json({ 
        success: false, 
        message: "Component not found" 
      });
    }

    res.json({ 
      success: true, 
      data: component 
    });
  } catch (error) {
    console.error("Get Component By ID Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ─── 4. Update Component Status ───────────────────────────────────────────────
const updateComponentStatus = async (req, res) => {
  try {
    const { component_id, status } = req.body;

    if (!component_id || status === undefined || status === null) {
      return res.status(400).json({ 
        success: false, 
        message: "component_id and status are required" 
      });
    }

    const [existing] = await sequelize.query(
      `SELECT component_id FROM component WHERE component_id = :component_id LIMIT 1`,
      { 
        replacements: { component_id }, 
        type: sequelize.QueryTypes.SELECT 
      }
    );
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: "Component not found" 
      });
    }

    await sequelize.query(
      `UPDATE component 
       SET component_status = :status, updated_at = NOW() 
       WHERE component_id = :component_id`,
      { 
        replacements: { 
          status: Number(status), 
          component_id 
        } 
      }
    );

    res.json({ 
      success: true, 
      message: "Component status updated successfully" 
    });
  } catch (error) {
    console.error("Update Component Status Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ─── 5. Update Component ──────────────────────────────────────────────────────
const updateComponent = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let {
      component_id   = null,
      component_name = null,
    } = req.body;

    component_id   = component_id   || null;
    component_name = component_name || null;

    // ✅ Get created_by_id from authenticated user
    const created_by_id = req.user?.id;

    if (!component_id) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "component_id is required" 
      });
    }

    if (!component_name) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "component_name is required" 
      });
    }

    if (!created_by_id) {
      await t.rollback();
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: user not found" 
      });
    }

    // Check if component exists
    const [existing] = await sequelize.query(
      `SELECT component_id FROM component WHERE component_id = :component_id LIMIT 1`,
      { 
        replacements: { component_id }, 
        type: sequelize.QueryTypes.SELECT, 
        transaction: t 
      }
    );
    if (!existing) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Component not found" 
      });
    }

    // Check name duplicate (exclude current component)
    const [nameExists] = await sequelize.query(
      `SELECT component_id FROM component 
       WHERE component_name = :component_name 
       AND component_id != :component_id LIMIT 1`,
      { 
        replacements: { component_name, component_id }, 
        type: sequelize.QueryTypes.SELECT, 
        transaction: t 
      }
    );
    if (nameExists) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "Component name already used by another component" 
      });
    }

    await sequelize.query(
      `UPDATE component SET
         component_name  = :component_name,
         created_by_id   = :created_by_id,
         updated_at      = NOW()
       WHERE component_id = :component_id`,
      {
        replacements: {
          component_name,
          created_by_id,
          component_id,
        },
        transaction: t,
      }
    );

    await t.commit();
    res.json({
      success: true,
      message: "Component updated successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("Update Component Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ─── 6. Delete Component ──────────────────────────────────────────────────────
const deleteComponent = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { component_id } = req.body;

    if (!component_id) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "component_id is required" 
      });
    }

    const [existing] = await sequelize.query(
      `SELECT component_id FROM component WHERE component_id = :component_id LIMIT 1`,
      { 
        replacements: { component_id }, 
        type: sequelize.QueryTypes.SELECT, 
        transaction: t 
      }
    );
    if (!existing) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Component not found" 
      });
    }

    await sequelize.query(
      `DELETE FROM component WHERE component_id = :component_id`,
      { 
        replacements: { component_id }, 
        transaction: t 
      }
    );

    await t.commit();
    res.json({ 
      success: true, 
      message: "Component deleted successfully" 
    });
  } catch (error) {
    await t.rollback();
    console.error("Delete Component Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ─── 7. Component Dropdown List ───────────────────────────────────────────────
const componentDropdownList = async (req, res) => {
  try {
    const components = await sequelize.query(
      `SELECT 
         component_id AS id,
         component_name AS name
       FROM component
       WHERE component_status = 1
       ORDER BY component_name ASC`,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      data: components
    });

  } catch (error) {
    console.error("Component Dropdown Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { 
  createComponent, 
  componentList, 
  getComponentById, 
  updateComponentStatus, 
  updateComponent, 
  deleteComponent,
  componentDropdownList 
};
