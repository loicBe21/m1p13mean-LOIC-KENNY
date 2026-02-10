const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const myLoggerMiddelware = require("./middlewares/logger");
const routeNotFoundMiddelware = require("./middlewares/baseMiddelware");

const healthRoutes = require("./routes/health.routes");
const boutiqueRoutes = require("./routes/boutique.routes");
const authRoutes = require("./routes/auth.routes");



const app = express();

app.use(cors());
app.use(express.json());
app.use(myLoggerMiddelware);


if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/health", healthRoutes);

app.use("/api/auth", authRoutes);

/*
boutiques routes
*/

app.use("/api/boutiques", boutiqueRoutes)






app.use(routeNotFoundMiddelware);

module.exports = app;
