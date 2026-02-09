// ============================================
// src/config/jwt.js
// Configuration JWT centralisée
// ============================================

require("dotenv").config();
const jwt = require("jsonwebtoken");

const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || "default_secret_change_in_production",
  EXPIRE: process.env.JWT_EXPIRE || "7d",
  ALGORITHM: "HS256",
};

/**
 * Générer un token JWT
 */
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, JWT_CONFIG.SECRET, {
    expiresIn: JWT_CONFIG.EXPIRE,
    algorithm: JWT_CONFIG.ALGORITHM,
  });
};

/**
 * Vérifier un token JWT
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  JWT_CONFIG,
  generateToken,
  verifyToken,
};
