const sequelize = require("../config/db");
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// ─── helpers ────────────────────────────────────────────────────────────────
const QR_DIR = path.join(__dirname, "../uploads/qrcodes");

const deleteFile = (dir, filename) => {
  if (!filename) return;
  const filePath = path.join(dir, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// ─── 1. Create Building ──────────────────────────────────────────────
const createBuilding = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let {
      customer_id   = null,
      building_name = null,
      postcode      = null,
      country_id    = null,
      state_id      = null,
      city_id       = null,
      address       = null,
      landmark      = null,
      status        = '1'
    } = req.body;

    customer_id   = customer_id   || null;
    building_name = building_name || null;
    postcode      = postcode      || null;
    country_id    = country_id    || null;
    state_id      = state_id      || null;
    city_id       = city_id       || null;
    address       = address       || null;
    landmark      = landmark      || null;
    status        = status        || '1';

    // ✅ Get created_by_id from authenticated user
    const created_by_id = req.user?.id;

    if (!customer_id || !building_name) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "customer_id and building_name are required" 
      });
    }

    if (!created_by_id) {
      await t.rollback();
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: user not found" 
      });
    }

    await sequelize.query(
      `INSERT INTO building_management
         (customer_id, building_name, postcode, country_id, state_id, city_id, 
          address, landmark, status, created_by_id, created_at)
       VALUES
         (:customer_id, :building_name, :postcode, :country_id, :state_id, :city_id,
          :address, :landmark, :status, :created_by_id, NOW())`,
      {
        replacements: {
          customer_id,
          building_name,
          postcode,
          country_id,
          state_id,
          city_id,
          address,
          landmark,
          status,
          created_by_id,
        },
        transaction: t,
      }
    );

    await t.commit();
    res.json({
      success: true,
      message: "Building created successfully"
    });
  } catch (error) {
    await t.rollback();
    console.error("Create Building Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 2. Building List (search + filter + pagination) ─────────────────
const buildingList = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", customer_id = null, status = null,created_by_id = null } = req.body;

    page  = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const replacements = {};

    if (search && search.trim() !== "") {
      where += ` AND (
        b.building_name LIKE :search OR
        b.postcode      LIKE :search OR
        b.address       LIKE :search OR
        b.landmark      LIKE :search
      )`;
      replacements.search = `%${search.trim()}%`;
    }

    if (customer_id !== null && customer_id !== "" && customer_id !== undefined) {
      where += ` AND b.customer_id = :customer_id`;
      replacements.customer_id = Number(customer_id);
    }

    if (status !== null && status !== "" && status !== undefined) {
      where += ` AND b.status = :status`;
      replacements.status = status;
    }

     // 👤 ✅ Created By filter (NEW)
    if (created_by_id !== null && created_by_id !== "" && created_by_id !== undefined) {
      where += ` AND b.created_by_id = :created_by_id`;
      replacements.created_by_id = Number(created_by_id);
    }

    // Total count
    const countResult = await sequelize.query(
      `SELECT COUNT(*) AS total FROM building_management b ${where}`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );
    const total = countResult[0].total;

    // Paginated rows
    const buildings = await sequelize.query(
      `SELECT
         b.building_id,
         b.customer_id,
         c.customer_name,
         b.building_name,
         b.postcode,
         b.country_id,
         co.country_name AS country_name,
         b.state_id,
         st.strStateName AS state_name,
         b.city_id,
         ci.strCityName  AS city_name,
         b.address,
         b.landmark,
         b.status,
         b.created_by_id,
         u.name          AS created_by_name,
         b.created_at,
         b.updated_at
       FROM building_management b
       LEFT JOIN customer      c  ON c.customer_id  = b.customer_id
       LEFT JOIN countrymaster co ON co.countryid   = b.country_id
       LEFT JOIN statemaster   st ON st.iStateId    = b.state_id
       LEFT JOIN citymaster    ci ON ci.iCityId     = b.city_id
       LEFT JOIN users         u  ON u.id           = b.created_by_id
       ${where}
       ORDER BY b.building_id DESC
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
      data: buildings,
    });
  } catch (error) {
    console.error("Building List Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 3. Get Building By ID ───────────────────────────────────────────────────
const getBuildingById = async (req, res) => {
  try {
    const { building_id } = req.body;

    if (!building_id) {
      return res.status(400).json({ success: false, message: "building_id is required" });
    }

    const [building] = await sequelize.query(
      `SELECT
         b.building_id,
         b.customer_id,
         c.customer_name,
         b.building_name,
         b.postcode,
         b.country_id,
         co.country_name AS country_name,
         b.state_id,
         st.strStateName AS state_name,
         b.city_id,
         ci.strCityName  AS city_name,
         b.address,
         b.landmark,
         b.status,
         b.created_by_id,
         u.name          AS created_by_name,
         b.created_at,
         b.updated_at
       FROM building_management b
       LEFT JOIN customer      c  ON c.customer_id  = b.customer_id
       LEFT JOIN countrymaster co ON co.countryid   = b.country_id
       LEFT JOIN statemaster   st ON st.iStateId    = b.state_id
       LEFT JOIN citymaster    ci ON ci.iCityId     = b.city_id
       LEFT JOIN users         u  ON u.id           = b.created_by_id
       WHERE b.building_id = :building_id
       LIMIT 1`,
      {
        replacements: { building_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!building) {
      return res.status(404).json({ success: false, message: "Building not found" });
    }

    res.json({ success: true, data: building });
  } catch (error) {
    console.error("Get Building By ID Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 4. Update Building Status ───────────────────────────────────────────────
const updateBuildingStatus = async (req, res) => {
  try {
    const { building_id, status } = req.body;

    if (!building_id || status === undefined || status === null) {
      return res.status(400).json({ 
        success: false, 
        message: "building_id and status are required" 
      });
    }

    const [existing] = await sequelize.query(
      `SELECT building_id FROM building_management WHERE building_id = :building_id LIMIT 1`,
      { replacements: { building_id }, type: sequelize.QueryTypes.SELECT }
    );
    if (!existing) {
      return res.status(404).json({ success: false, message: "Building not found" });
    }

    await sequelize.query(
      `UPDATE building_management SET status = :status, updated_at = NOW() WHERE building_id = :building_id`,
      { replacements: { status, building_id } }
    );

    res.json({ success: true, message: "Building status updated successfully" });
  } catch (error) {
    console.error("Update Building Status Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 5. Update Building ──────────────────────────────────────────────────────
const updateBuilding = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let {
      building_id   = null,
      customer_id   = null,
      building_name = null,
      postcode      = null,
      country_id    = null,
      state_id      = null,
      city_id       = null,
      address       = null,
      landmark      = null,
      status        = '1'
    } = req.body;

    building_id   = building_id   || null;
    customer_id   = customer_id   || null;
    building_name = building_name || null;
    postcode      = postcode      || null;
    country_id    = country_id    || null;
    state_id      = state_id      || null;
    city_id       = city_id       || null;
    address       = address       || null;
    landmark      = landmark      || null;
    status        = status        || '1';

    // ✅ Get created_by_id from authenticated user
    const created_by_id = req.user?.id;

    if (!building_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "building_id is required" });
    }

    if (!customer_id || !building_name) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "customer_id and building_name are required" 
      });
    }

    if (!created_by_id) {
      await t.rollback();
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: user not found" 
      });
    }

    // Check if building exists
    const [existing] = await sequelize.query(
      `SELECT building_id FROM building_management WHERE building_id = :building_id LIMIT 1`,
      { replacements: { building_id }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (!existing) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Building not found" });
    }

    await sequelize.query(
      `UPDATE building_management SET
         customer_id   = :customer_id,
         building_name = :building_name,
         postcode      = :postcode,
         country_id    = :country_id,
         state_id      = :state_id,
         city_id       = :city_id,
         address       = :address,
         landmark      = :landmark,
         status        = :status,
         created_by_id = :created_by_id,
         updated_at    = NOW()
       WHERE building_id = :building_id`,
      {
        replacements: {
          customer_id,
          building_name,
          postcode,
          country_id,
          state_id,
          city_id,
          address,
          landmark,
          status,
          created_by_id,
          building_id,
        },
        transaction: t,
      }
    );

    await t.commit();
    res.json({
      success: true,
      message: "Building updated successfully"
    });
  } catch (error) {
    await t.rollback();
    console.error("Update Building Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 6. Delete Building ──────────────────────────────────────────────────────
const deleteBuilding = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { building_id } = req.body;

    if (!building_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "building_id is required" });
    }

    const [existing] = await sequelize.query(
      `SELECT building_id FROM building_management WHERE building_id = :building_id LIMIT 1`,
      { replacements: { building_id }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (!existing) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Building not found" });
    }

    // Remove QR code file from disk
    deleteFile(QR_DIR, `building_${building_id}.png`);

    await sequelize.query(
      `DELETE FROM building_management WHERE building_id = :building_id`,
      { replacements: { building_id }, transaction: t }
    );

    await t.commit();
    res.json({ success: true, message: "Building deleted successfully" });
  } catch (error) {
    await t.rollback();
    console.error("Delete Building Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 7. Generate QR Code ──────────────────────────────────────────────────────
const generateQRCode = async (req, res) => {
  try {
    const { building_id } = req.body;

    if (!building_id) {
      return res.status(400).json({ success: false, message: "building_id is required" });
    }

    // Get building details
    const [building] = await sequelize.query(
      `SELECT
         b.building_id,
         b.customer_id,
         c.customer_name,
         b.building_name,
         b.postcode,
         b.country_id,
         b.state_id,
         b.city_id,
         b.address,
         b.landmark,
         b.status,
         b.created_at
       FROM building_management b
       LEFT JOIN customer c ON c.customer_id = b.customer_id
       WHERE b.building_id = :building_id
       LIMIT 1`,
      {
        replacements: { building_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!building) {
      return res.status(404).json({ success: false, message: "Building not found" });
    }

    // Create QR code data with all building information
    const qrData = {
      building_id: building.building_id,
      building_name: building.building_name,
      customer_name: building.customer_name,
      customer_id: building.customer_id,
      postcode: building.postcode,
      country_id: building.country_id,
      state_id: building.state_id,
      city_id: building.city_id,
      address: building.address,
      landmark: building.landmark,
      status: building.status,
      created_at: building.created_at
    };

    // Convert to JSON string for QR code
    const qrString = JSON.stringify(qrData);

    // Create uploads/qrcodes directory if it doesn't exist
    if (!fs.existsSync(QR_DIR)) {
      fs.mkdirSync(QR_DIR, { recursive: true });
    }

    // Generate QR code and save to file
    const qrFileName = `building_${building_id}.png`;
    const qrFilePath = path.join(QR_DIR, qrFileName);

    await QRCode.toFile(qrFilePath, qrString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Generate base64 for immediate display
    const qrBase64 = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    res.json({
      success: true,
      message: "QR Code generated successfully",
      data: {
        qrCode: qrBase64,
        qrFilePath: `${baseUrl}/uploads/qrcodes/${qrFileName}`,
        buildingInfo: qrData
      }
    });
  } catch (error) {
    console.error("Generate QR Code Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── 8. Print QR Code ──────────────────────────────────────────────────────
const printQRCode = async (req, res) => {
  try {
    const { building_id } = req.body;

    if (!building_id) {
      return res.status(400).json({ success: false, message: "building_id is required" });
    }

    // Get building details
    const [building] = await sequelize.query(
      `SELECT
         b.building_id,
         b.customer_id,
         c.customer_name,
         b.building_name,
         b.postcode,
         b.address,
         b.landmark,
         b.status
       FROM building_management b
       LEFT JOIN customer c ON c.customer_id = b.customer_id
       WHERE b.building_id = :building_id
       LIMIT 1`,
      {
        replacements: { building_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!building) {
      return res.status(404).json({ success: false, message: "Building not found" });
    }

    // Create QR code data
    const qrData = {
      building_id: building.building_id,
      building_name: building.building_name,
      customer_name: building.customer_name,
      customer_id: building.customer_id,
      postcode: building.postcode,
      address: building.address,
      landmark: building.landmark,
      status: building.status
    };

    const qrString = JSON.stringify(qrData);

    // Generate high-quality QR code for printing
    const qrBase64 = await QRCode.toDataURL(qrString, {
      width: 500,
      margin: 3,
      errorCorrectionLevel: 'H'
    });

    // Create HTML for printing
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Building QR Code - ${building.building_name}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .qr-container {
            text-align: center;
            border: 2px solid #333;
            padding: 30px;
            border-radius: 10px;
            background: white;
          }
          .qr-image {
            max-width: 500px;
            height: auto;
          }
          .building-info {
            margin-top: 20px;
            text-align: left;
          }
          .building-info h2 {
            margin: 0 0 15px 0;
            color: #333;
            text-align: center;
          }
          .info-row {
            margin: 8px 0;
            font-size: 14px;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          .print-btn {
            margin-top: 20px;
            padding: 10px 30px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          }
          .print-btn:hover {
            background: #0056b3;
          }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <h2>Building QR Code</h2>
          <img src="${qrBase64}" alt="Building QR Code" class="qr-image" />
          <div class="building-info">
            <h2>${building.building_name}</h2>
            <div class="info-row">
              <span class="info-label">Building ID:</span> ${building.building_id}
            </div>
            <div class="info-row">
              <span class="info-label">Customer:</span> ${building.customer_name || 'N/A'}
            </div>
            <div class="info-row">
              <span class="info-label">Address:</span> ${building.address || 'N/A'}
            </div>
            <div class="info-row">
              <span class="info-label">Landmark:</span> ${building.landmark || 'N/A'}
            </div>
            <div class="info-row">
              <span class="info-label">Postcode:</span> ${building.postcode || 'N/A'}
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span> ${building.status}
            </div>
          </div>
          <button class="print-btn no-print" onclick="window.print()">Print QR Code</button>
        </div>
      </body>
      </html>
    `;

    res.send(printHTML);
  } catch (error) {
    console.error("Print QR Code Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBuilding,
  buildingList,
  getBuildingById,
  updateBuildingStatus,
  updateBuilding,
  deleteBuilding,
  generateQRCode,
  printQRCode
};
