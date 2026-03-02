require("./config/env");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const categorieRoutes = require("./routes/categorie.routes");

const app = require("./app");
const { PORT, NODE_ENV } = require("./config/env");
const connectDB = require("./config/db");

// Connexion à MongoDB
connectDB().then(() => {
  // Démarrage serveur seulement si DB OK
  app.listen(PORT, () => {
    console.log(`🚀 API running on port ${PORT} (${NODE_ENV})`);
  });
});


app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  })
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categorieRoutes);
