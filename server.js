require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const sequelize = require("./config/db");
require("./models/userModel");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// ✅ Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/auth", require("./routes/roleRoutes"));
app.use("/api/auth", require("./routes/employeeRoutes"));
app.use("/api/auth", require("./routes/locationRoutes"));
app.use("/api/auth", require("./routes/customerRoutes"));
app.use("/api/auth", require("./routes/buildingRoutes"));
app.use("/api/auth", require("./routes/componentRoutes"));
app.use("/api/auth", require("./routes/maintenanceTypeRoutes"));

// ✅ DB Sync
sequelize
  .sync()
  .then(() => console.log("Database connected & synced"))
  .catch((err) => console.log(err));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
