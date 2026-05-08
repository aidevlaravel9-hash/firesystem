const sequelize = require("../config/db");
const fs = require("fs");
const path = require("path");

// ─── helpers ────────────────────────────────────────────────────────────────

const LOGO_DIR      = path.join(__dirname, "../uploads/customer_logos");
const LOGO_ICON_DIR = path.join(__dirname, "../uploads/customer_logo_icons");

const deleteFile = (dir, filename) => {
  if (!filename) return;
  const filePath = path.join(dir, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

const buildUrl = (req, folder, filename) =>
  filename ? `${req.protocol}://${req.get("host")}/uploads/${folder}/${filename}` : null;

// ─── 1. Create Customer ──────────────────────────────────────────────
const createCustomer = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let {
      customer_name         = null,
      customer_company_name = null,
      customer_email        = null,
      customer_number       = null,
      customer_post_code    = null,
      customer_address      = null,
      customer_country_id   = null,
      customer_state_id     = null,
      customer_city_id      = null,
    } = req.body;

    customer_name         = customer_name         || null;
    customer_company_name = customer_company_name || null;
    customer_email        = customer_email        || null;
    customer_number       = customer_number       || null;
    customer_post_code    = customer_post_code    || null;
    customer_address      = customer_address      || null;
    customer_country_id   = customer_country_id   || null;
    customer_state_id     = customer_state_id     || null;
    customer_city_id      = customer_city_id      || null;

    if (!customer_name || !customer_email || !customer_number) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "customer_name, customer_email and customer_number are required" });
    }

    // Duplicate email check
    const [emailExists] = await sequelize.query(
      `SELECT customer_id FROM customer WHERE customer_email = :customer_email LIMIT 1`,
      { replacements: { customer_email }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (emailExists) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // File uploads
    const logoFile     = req.files?.customer_company_logo?.[0]?.filename     || null;
    const logoIconFile = req.files?.customer_company_logo_icon?.[0]?.filename || null;

    await sequelize.query(
      `INSERT INTO customer
         (customer_name, customer_company_name, customer_email, customer_number,
          customer_post_code, customer_address, customer_country_id, customer_state_id,
          customer_city_id, customer_company_logo, customer_company_logo_icon, created_at)
       VALUES
         (:customer_name, :customer_company_name, :customer_email, :customer_number,
          :customer_post_code, :customer_address, :customer_country_id, :customer_state_id,
          :customer_city_id, :customer_company_logo, :customer_company_logo_icon, NOW())`,
      {
        replacements: {
          customer_name, customer_company_name, customer_email,
          customer_number, customer_post_code, customer_address,
          customer_country_id, customer_state_id, customer_city_id,
          customer_company_logo:      logoFile,
          customer_company_logo_icon: logoIconFile,
        },
        transaction: t,
      }
    );

    await t.commit();
    res.json({
      success: true,
      message: "Customer created successfully",
      logo_url:      buildUrl(req, "customer_logos",      logoFile),
      logo_icon_url: buildUrl(req, "customer_logo_icons", logoIconFile),
    });
  } catch (error) {
    await t.rollback();
    console.error("Create Customer Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 2. Customer List (search + country filter + pagination) ─────────────────
const customerList = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", country_id = null } = req.body;

    page  = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const replacements = {};

    if (search && search.trim() !== "") {
      where += ` AND (
        c.customer_name         LIKE :search OR
        c.customer_company_name LIKE :search OR
        c.customer_email        LIKE :search OR
        c.customer_number       LIKE :search
      )`;
      replacements.search = `%${search.trim()}%`;
    }

    if (country_id !== null && country_id !== "" && country_id !== undefined) {
      where += ` AND c.customer_country_id = :country_id`;
      replacements.country_id = Number(country_id);
    }

    // Total count
    const countResult = await sequelize.query(
      `SELECT COUNT(*) AS total FROM customer c ${where}`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );
    const total = countResult[0].total;

    // Paginated rows
    const customers = await sequelize.query(
      `SELECT
         c.customer_id,
         c.customer_name,
         c.customer_company_name,
         c.customer_email,
         c.customer_number,
         c.customer_post_code,
         c.customer_address,
         c.customer_status,
         c.customer_country_id,
         co.country_name        AS country_name,
         c.customer_state_id,
         st.strStateName        AS state_name,
         c.customer_city_id,
         ci.strCityName         AS city_name,
         c.customer_company_logo,
         c.customer_company_logo_icon,
         c.created_at
       FROM customer c
       LEFT JOIN countrymaster co ON co.countryid   = c.customer_country_id
       LEFT JOIN statemaster   st ON st.iStateId    = c.customer_state_id
       LEFT JOIN citymaster    ci ON ci.iCityId     = c.customer_city_id
       ${where}
       ORDER BY c.customer_id DESC
       LIMIT :limit OFFSET :offset`,
      {
        replacements: { ...replacements, limit, offset },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const data = customers.map((c) => ({
      ...c,
      logo_url:      c.customer_company_logo
        ? `${baseUrl}/uploads/customer_logos/${c.customer_company_logo}`
        : null,
      logo_icon_url: c.customer_company_logo_icon
        ? `${baseUrl}/uploads/customer_logo_icons/${c.customer_company_logo_icon}`
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
    console.error("Customer List Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 3. Update Customer Status ───────────────────────────────────────────────
const updateCustomerStatus = async (req, res) => {
  try {
    const { customer_id, status } = req.body;

    if (!customer_id || status === undefined || status === null) {
      return res.status(400).json({ success: false, message: "customer_id and status are required" });
    }

    const [existing] = await sequelize.query(
      `SELECT customer_id FROM customer WHERE customer_id = :customer_id LIMIT 1`,
      { replacements: { customer_id }, type: sequelize.QueryTypes.SELECT }
    );
    if (!existing) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    await sequelize.query(
      `UPDATE customer SET customer_status = :status, updated_at = NOW() WHERE customer_id = :customer_id`,
      { replacements: { status: Number(status), customer_id } }
    );

    res.json({ success: true, message: "Customer status updated successfully" });
  } catch (error) {
    console.error("Update Customer Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 4. Delete Customer ──────────────────────────────────────────────────────
const deleteCustomer = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { customer_id } = req.body;

    if (!customer_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "customer_id is required" });
    }

    const [existing] = await sequelize.query(
      `SELECT customer_id, customer_company_logo, customer_company_logo_icon
       FROM customer WHERE customer_id = :customer_id LIMIT 1`,
      { replacements: { customer_id }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (!existing) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Remove files from disk
    deleteFile(LOGO_DIR,      existing.customer_company_logo);
    deleteFile(LOGO_ICON_DIR, existing.customer_company_logo_icon);

    await sequelize.query(
      `DELETE FROM customer WHERE customer_id = :customer_id`,
      { replacements: { customer_id }, transaction: t }
    );

    await t.commit();
    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    await t.rollback();
    console.error("Delete Customer Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createCustomer, customerList, updateCustomerStatus, deleteCustomer };
