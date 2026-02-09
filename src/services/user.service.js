// ============================================
// src/services/user.service.js
// Service utilisateurs - Logique métier
// ============================================

const User = require("../models/User");

/**
 * Service : Obtenir tous les utilisateurs
 * @param {Object} filters - Filtres optionnels
 * @returns {Array} Liste d'utilisateurs
 */
const getAllUsers = async (filters = {}) => {
  try {
    const users = await User.find(filters)
      .select("-motDePasse")
      .sort({ nom: 1 });
    return users;
  } catch (error) {
    console.error(" [UserService] Erreur getAllUsers:", error.message);
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
    console.error(" [UserService] Erreur getUserById:", error.message);
    throw error;
  }
};

/**
 * Service : Mettre à jour le profil
 * @param {String} userId - ID de l'utilisateur
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Object} User mis à jour
 */
const updateProfile = async (userId, updateData) => {
  try {
    console.log(`  [UserService] Mise à jour profil ${userId}`);

    const user = await User.findById(userId);

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Mettre à jour les champs autorisés
    if (updateData.nom) user.nom = updateData.nom;
    if (updateData.telephone) user.telephone = updateData.telephone;
    if (updateData.adresse)
      user.adresse = { ...user.adresse, ...updateData.adresse };

    await user.save();

    console.log(" Profil mis à jour");

    return user;
  } catch (error) {
    console.error(" [UserService] Erreur updateProfile:", error.message);
    throw error;
  }
};

/**
 * Service : Obtenir utilisateurs par rôle
 * @param {String} role - Rôle à filtrer
 * @returns {Array} Liste d'utilisateurs
 */
const getUsersByRole = async (role) => {
  try {
    const users = await User.find({ role })
      .select("-motDePasse")
      .sort({ nom: 1 });
    return users;
  } catch (error) {
    console.error(" [UserService] Erreur getUsersByRole:", error.message);
    throw error;
  }
};

/**
 * Service : Obtenir utilisateurs par boutique
 * @param {String} boutiqueId - ID de la boutique
 * @returns {Array} Liste d'utilisateurs
 */
const getUsersByBoutique = async (boutiqueId) => {
  try {
    const users = await User.find({
      role: "boutique",
      boutiqueId,
    })
      .select("-motDePasse")
      .sort({ nom: 1 });

    return users;
  } catch (error) {
    console.error("  [UserService] Erreur getUsersByBoutique:", error.message);
    throw error;
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateProfile,
  getUsersByRole,
  getUsersByBoutique,
};
