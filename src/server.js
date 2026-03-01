import dotenv from "dotenv";
dotenv.config({ path: './.env' }); // doit être tout en haut

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import auth from "./routes/auth.routes.js";
import categorie from "./routes/categorie.routes.js";

const app = express();

// Parser JSON avant les routes

// CORS
app.use(cors({
  origin: "http://localhost:4200",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


app.use(express.json({ limit: '100mb' }));       // taille maximale du corps JSON
app.use(express.urlencoded({ limit: '100mb', extended: true })); // pour les formulaires urlencoded


// Routes
app.use("/api/auth", auth);
app.use("/api/categories", categorie);





// Vérifie si la variable d'environnement est bien chargée
console.log("Mongo URI:", process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connecté !"))
  .catch(err => console.error("❌ MongoDB connection failed:", err));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Serveur démarré sur le port ${port}`));