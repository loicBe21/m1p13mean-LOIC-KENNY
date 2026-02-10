// ============================================
// src/middleware/auth/authJwt.middleware.js
// Middleware d'authentification JWT
// ============================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();




/**
 * 
 *
 * 
 * 
 * 
 */

const authJwtMiddleware = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Non authentifié",
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Trouver l'utilisateur
    const user = await User.findById(decoded.id).select("-motDePasse");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Utilisateur non trouvé",
      });
    }

    if (!user.actif) {
      return res.status(401).json({
        success: false,
        error: "Compte désactivé",
      });
    }

    // Attacher à la requête
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Token invalide",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expiré",
      });
    }

    res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
};

module.exports = authJwtMiddleware;
