const sequelize = require("../config/db");

// ─── 1. Create Maintenance Type ──────────────────────────────────────────────
const createMaintenanceType = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let { 
      type_id = null,
      maintenance_cycle = null 
    } = req.body;

    type_id = type_id || null;
    maintenance_cycle = maintenance_cycle || null;

    // ✅ Get created_by_id from authenticated user
    const created_by_id = req.user?.id;

    if (!type_id) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "type_id is required" 
      });
    }

    if (!maintenance_cycle) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "maintenance_cycle is required" 
      });
    }

    if (!created_by_id) {
      await t.rollback();
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: user not found" 
      });
    }

    // Convert array to comma-separated string if needed
    let cycleString = maintenance_cycle;
    if (Array.isArray(maintenance_cycle)) {
      cycleString = maintenance_cycle.join(',');
    }

    await sequelize.query(
      `INSERT INTO maintenance_type
         (type_id, maintenance_cycle, created_by_id, created_at)
       VALUES
         (:type_id, :maintenance_cycle, :created_by_id, NOW())`,
      {
        replacements: {
          type_id,
          maintenance_cycle: cycleString,
          created_by_id,
        },
        transaction: t,
      }
    );

    await t.commit();
    res.json({
      success: true,
      message: "Maintenance type created successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("Create Maintenance Type Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ─── 2. Maintenance Type List (search + pagination) ─────────────────
const maintenanceTypeList = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.body;

    page  = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const replacements = {};

    // ✅ SEARCH BY TYPE NAME + CYCLE
    if (search && search.trim() !== "") {
      where += ` 
        AND (
          mtm.maintenance_type_name LIKE :search 
          OR mt.maintenance_cycle LIKE :search
        )`;
      replacements.search = `%${search.trim()}%`;
    }

    // ✅ COUNT QUERY WITH JOIN
    const countResult = await sequelize.query(
      `SELECT COUNT(*) AS total 
       FROM maintenance_type mt
       LEFT JOIN maintenance_type_master mtm ON mtm.id = mt.type_id
       ${where}`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );

    const total = countResult[0].total;

    // ✅ MAIN DATA QUERY WITH TYPE NAME
    const maintenanceTypes = await sequelize.query(
      `SELECT
         mt.id,
         mt.type_id,
         mtm.maintenance_type_name,   -- ✅ TYPE NAME
         mt.maintenance_cycle,
         mt.status,
         mt.created_by_id,
         u.name AS created_by_name,
         mt.created_at,
         mt.updated_at
       FROM maintenance_type mt
       LEFT JOIN users u ON u.id = mt.created_by_id
       LEFT JOIN maintenance_type_master mtm ON mtm.id = mt.type_id
       ${where}
       ORDER BY mt.id DESC
       LIMIT :limit OFFSET :offset`,
      {
        replacements: { ...replacements, limit, offset },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // ✅ Convert cycle string → array
    const data = maintenanceTypes.map(item => ({
      ...item,
      //maintenance_cycle_array: item.maintenance_cycle
      //  ? item.maintenance_cycle.split(',')
      //  : []
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
    console.error("Maintenance Type List Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ─── 3. Get Maintenance Type By ID ───────────────────────────────────────────────────
const getMaintenanceTypeById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: "id is required" 
      });
    }

    const [maintenanceType] = await sequelize.query(
      `SELECT
         mt.id,
         mt.type_id,
         mt.maintenance_cycle,
         mt.status,
         mt.created_by_id,
         u.name AS created_by_name,
         mt.created_at,
         mt.updated_at
       FROM maintenance_type mt
       LEFT JOIN users u ON u.id = mt.created_by_id
       WHERE mt.id = :id
       LIMIT 1`,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!maintenanceType) {
      return res.status(404).json({ 
        success: false, 
        message: "Maintenance type not found" 
      });
    }

    // Convert maintenance_cycle string to array
    const data = {
      ...maintenanceType,
      //maintenance_cycle_array: maintenanceType.maintenance_cycle ? maintenanceType.maintenance_cycle.split(',') : []
    };

    res.json({ 
      success: true, 
      data 
    });
  } catch (error) {
    console.error("Get Maintenance Type By ID Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ─── 4. Update Maintenance Type Status ───────────────────────────────────────────────
const updateMaintenanceTypeStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || status === undefined || status === null) {
      return res.status(400).json({ 
        success: false, 
        message: "id and status are required" 
      });
    }

    const [existing] = await sequelize.query(
      `SELECT id FROM maintenance_type WHERE id = :id LIMIT 1`,
      { 
        replacements: { id }, 
        type: sequelize.QueryTypes.SELECT 
      }
    );
    if (!existing) {
      return res.status(404).json({ 
        success: false, 
        message: "Maintenance type not found" 
      });
    }

    await sequelize.query(
      `UPDATE maintenance_type 
       SET status = :status, updated_at = NOW() 
       WHERE id = :id`,
      { 
        replacements: { 
          status: Number(status), 
          id 
        } 
      }
    );

    res.json({ 
      success: true, 
      message: "Maintenance type status updated successfully" 
    });
  } catch (error) {
    console.error("Update Maintenance Type Status Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ─── 5. Update Maintenance Type ──────────────────────────────────────────────────────
const updateMaintenanceType = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let {
      id = null,
      type_id = null,
      maintenance_cycle = null,
    } = req.body;

    id = id || null;
    type_id = type_id || null;
    maintenance_cycle = maintenance_cycle || null;

    // ✅ Get created_by_id from authenticated user
    const created_by_id = req.user?.id;

    if (!id) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "id is required" 
      });
    }

    if (!type_id) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "type_id is required" 
      });
    }

    if (!maintenance_cycle) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "maintenance_cycle is required" 
      });
    }

    if (!created_by_id) {
      await t.rollback();
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: user not found" 
      });
    }

    // Convert array to comma-separated string if needed
    let cycleString = maintenance_cycle;
    if (Array.isArray(maintenance_cycle)) {
      cycleString = maintenance_cycle.join(',');
    }

    // Check if maintenance type exists
    const [existing] = await sequelize.query(
      `SELECT id FROM maintenance_type WHERE id = :id LIMIT 1`,
      { 
        replacements: { id }, 
        type: sequelize.QueryTypes.SELECT, 
        transaction: t 
      }
    );
    if (!existing) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Maintenance type not found" 
      });
    }

    await sequelize.query(
      `UPDATE maintenance_type SET
         type_id = :type_id,
         maintenance_cycle = :maintenance_cycle,
         created_by_id = :created_by_id,
         updated_at = NOW()
       WHERE id = :id`,
      {
        replacements: {
          type_id,
          maintenance_cycle: cycleString,
          created_by_id,
          id,
        },
        transaction: t,
      }
    );

    await t.commit();
    res.json({
      success: true,
      message: "Maintenance type updated successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("Update Maintenance Type Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ─── 6. Delete Maintenance Type ──────────────────────────────────────────────────────
const deleteMaintenanceType = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.body;

    if (!id) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "id is required" 
      });
    }

    const [existing] = await sequelize.query(
      `SELECT id FROM maintenance_type WHERE id = :id LIMIT 1`,
      { 
        replacements: { id }, 
        type: sequelize.QueryTypes.SELECT, 
        transaction: t 
      }
    );
    if (!existing) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Maintenance type not found" 
      });
    }

    await sequelize.query(
      `DELETE FROM maintenance_type WHERE id = :id`,
      { 
        replacements: { id }, 
        transaction: t 
      }
    );

    await t.commit();
    res.json({ 
      success: true, 
      message: "Maintenance type deleted successfully" 
    });
  } catch (error) {
    await t.rollback();
    console.error("Delete Maintenance Type Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ─── 7. Maintenance Type Dropdown List ───────────────────────────────────────────────
const maintenanceTypeDropdownList1 = async (req, res) => {
  try {
    const maintenanceTypes = await sequelize.query(
      `SELECT 
         id,
         type_id,
         maintenance_cycle
       FROM maintenance_type
       WHERE status = 1
       ORDER BY type_id ASC`,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Convert maintenance_cycle string to array for each record
    const data = maintenanceTypes.map(item => ({
      ...item,
      maintenance_cycle_array: item.maintenance_cycle ? item.maintenance_cycle.split(',') : []
    }));

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error("Maintenance Type Dropdown Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const maintenanceTypeDropdownList = async (req, res) => {
  try {
    const maintenanceTypes = await sequelize.query(
      `SELECT 
         id,
         maintenance_type_name AS name
       FROM maintenance_type_master
       ORDER BY maintenance_type_name ASC`,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    res.json({
      success: true,
      data: maintenanceTypes
    });

  } catch (error) {
    console.error("Maintenance Type Dropdown Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { 
  createMaintenanceType, 
  maintenanceTypeList, 
  getMaintenanceTypeById, 
  updateMaintenanceTypeStatus, 
  updateMaintenanceType, 
  deleteMaintenanceType,
  maintenanceTypeDropdownList 
};
