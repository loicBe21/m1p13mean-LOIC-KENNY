const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const myLoggerMiddelware = require("./middlewares/logger");
const routeNotFoundMiddelware = require("./middlewares/baseMiddelware");

const healthRoutes = require("./routes/health.routes");
const boutiqueRoutes = require("./routes/boutiqueRoutes");



const app = express();

app.use(cors());
app.use(express.json());
app.use(myLoggerMiddelware);


if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/health", healthRoutes);

/*
boutiques routes
*/

app.use("/api/boutiques", boutiqueRoutes)






app.use(routeNotFoundMiddelware);

module.exports = app;
