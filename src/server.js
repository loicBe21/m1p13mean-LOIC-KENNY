import dotenv from "dotenv";
dotenv.config({ path: './.env' }); // doit être tout en haut

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import auth from "./routes/auth.routes.js";

const app = express();

// Parser JSON avant les routes
app.use(express.json());

// CORS
app.use(cors({
  origin: "http://localhost:4200",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Routes
app.use("/api/auth", auth);

// Vérifie si la variable d'environnement est bien chargée
console.log("Mongo URI:", process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connecté !"))
  .catch(err => console.error("❌ MongoDB connection failed:", err));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Serveur démarré sur le port ${port}`));