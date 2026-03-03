const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const myLoggerMiddelware = require("./middlewares/logger");
const routeNotFoundMiddelware = require("./middlewares/baseMiddelware");

const healthRoutes = require("./routes/health.routes");
const boutiqueRoutes = require("./routes/boutique.routes");
const categorieRoutes = require("./routes/categorie.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const produitRoutes = require("./routes/produit.routes");
const orderRoutes = require("./routes/order.routes");
const cartRoutes = require("./routes/cart.routes");



const app = express();

app.use(cors());

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.use(myLoggerMiddelware);


if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/health", healthRoutes);

app.use("/api/auth", authRoutes);


app.use("/api/boutiques", boutiqueRoutes);

app.use("/api/categories", categorieRoutes);

app.use("/api/users" , userRoutes);

app.use("/api/produits", produitRoutes);


// Routes commandes (back-office)
app.use("/api/orders", orderRoutes);

//Routes panier
app.use("/api/cart" , cartRoutes);








app.use(routeNotFoundMiddelware);

module.exports = app;
