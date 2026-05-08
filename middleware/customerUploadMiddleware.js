const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload folders exist
const logoPath     = path.join(__dirname, "../uploads/customer_logos");
const logoIconPath = path.join(__dirname, "../uploads/customer_logo_icons");

if (!fs.existsSync(logoPath))     fs.mkdirSync(logoPath,     { recursive: true });
if (!fs.existsSync(logoIconPath)) fs.mkdirSync(logoIconPath, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "customer_company_logo") {
      cb(null, logoPath);
    } else {
      cb(null, logoIconPath);
    }
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "_" + file.fieldname + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const customerUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const isValidExt  = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const isValidMime = allowedTypes.test(file.mimetype);
    if (isValidExt && isValidMime) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
    }
  },
});

// Middleware wrapper — returns clean JSON error instead of HTML crash
const handleCustomerUpload = (req, res, next) => {
  const upload = customerUpload.fields([
    { name: "customer_company_logo",      maxCount: 1 },
    { name: "customer_company_logo_icon", maxCount: 1 },
  ]);

  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed",
      });
    }
    next();
  });
};

module.exports = { customerUpload, handleCustomerUpload };
