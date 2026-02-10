// ============================================
// src/services/auth.service.js
// Service d'authentification - Logique métier
// ============================================

const User = require("../models/User");
const { generateToken } = require("../config/jwt");

/**
 * Service : Inscription utilisateur
 * @param {Object} userData - Données utilisateur validées
 * @returns {Object} { user, token }
 */
const registerUser = async (userData) => {
  try {
    console.log(" [AuthService] Création utilisateur...");

    // Créer l'utilisateur (hashage automatique via hook Mongoose)
    const user = await User.create(userData);

    console.log(` Utilisateur créé: ${user.email}`);

    // Générer le token JWT
    const token = generateToken(user._id, user.role);

    return { user, token };
  } catch (error) {
    console.error(error);
    console.error(" [AuthService] Erreur registerUser:", error.message);
    throw error;
  }
};

/**
 * Service : Connexion utilisateur
 * @param {String} email - Email de l'utilisateur
 * @param {String} password - Mot de passe
 * @returns {Object} { user, token } ou null si échec
 */
const loginUser = async (email, password) => {
  try {
    console.log(" [AuthService] Tentative de connexion...");

    // Trouver l'utilisateur + mot de passe
    const user = await User.findByEmail(email);

    if (!user) {
      console.log(" Utilisateur non trouvé");
      return null;
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log(" Mot de passe incorrect");
      return null;
    }

    // Vérifier si compte actif
    if (!user.actif) {
      console.log(" Compte désactivé");
      return null;
    }

    console.log(` Connexion réussie: ${user.email}`);

    // Générer le token
    const token = generateToken(user._id, user.role);

    return { user, token };
  } catch (error) {
    console.error(" [AuthService] Erreur loginUser:", error.message);
    throw error;
  }
};

/**
 * Service : Obtenir utilisateur par ID
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} User ou null
 */
const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId).select("-motDePasse");
    return user;
  } catch (error) {
    console.error(" [AuthService] Erreur getUserById:", error.message);
    throw error;
  }
};

/**
 * Service : Vérifier si email existe
 * @param {String} email - Email à vérifier
 * @returns {Boolean}
 */
const emailExists = async (email) => {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    return !!user;
  } catch (error) {
    console.error(" [AuthService] Erreur emailExists:", error.message);
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  emailExists,
};
