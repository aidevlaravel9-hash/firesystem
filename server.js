require("dotenv").config(); // ✅ MUST BE FIRST

const express = require("express");
const cors = require("cors");

const sequelize = require("./config/db");
require("./models/userModel");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));

sequelize
  .sync()
  .then(() => console.log("Database connected & synced"))
  .catch((err) => console.log(err));

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
