// ============================================
// src/utils/validationHelpers.js
// Helpers de validation réutilisables et typés
// ============================================

const mongoose = require("mongoose");
const User = require("../models/User");

/**
 * Valider que tous les IDs sont des ObjectId valides
 * @param {Array} ids - Liste d'IDs à valider
 * @param {String} fieldName - Nom du champ pour le message d'erreur
 * @throws {ValidationError} Si IDs invalides
 */
const validateObjectIds = (ids, fieldName) => {
  if (!Array.isArray(ids) || ids.length === 0) return;

  const invalidIds = ids.filter((id) => {
    try {
      new mongoose.Types.ObjectId(id);
      return false;
    } catch {
      return true;
    }
  });

  if (invalidIds.length > 0) {
    throw new ValidationError(
      `IDs ${fieldName} invalides`,
      invalidIds.map((id) => ({ id, reason: "Format ObjectId invalide" }))
    );
  }
};

/**
 * Valider que des documents existent et sont actifs
 * @param {Model} Model - Modèle Mongoose
 * @param {Array} ids - Liste d'IDs à valider
 * @param {String} fieldName - Nom du champ pour le message d'erreur
 * @param {Object} session - Session MongoDB (optionnel)
 * @returns {Array} Documents valides
 * @throws {ValidationError} Si documents manquants ou inactifs
 */
const validateActiveDocuments = async (
  Model,
  ids,
  fieldName,
  session = null
) => {
  if (ids.length === 0) return [];

  const query = Model.find({
    _id: { $in: ids },
    actif: true,
  });

  if (session) query.session(session);

  const validDocs = await query.lean();

  if (validDocs.length !== ids.length) {
    const validIds = validDocs.map((doc) => doc._id.toString());
    const invalid = ids.filter((id) => !validIds.includes(id));

    // Récupérer les documents inactifs pour message précis
    const allDocs = await Model.find({ _id: { $in: ids } }).lean();
    const inactive = allDocs.filter(
      (doc) => !doc.actif && invalid.includes(doc._id.toString())
    );
    const missing = invalid.filter(
      (id) => !allDocs.some((doc) => doc._id.toString() === id)
    );

    const errors = [
      ...inactive.map((doc) => ({ id: doc._id, reason: "Document inactif" })),
      ...missing.map((id) => ({ id, reason: "Document non trouvé" })),
    ];

    throw new ValidationError(`${fieldName} invalides ou inactifs`, errors);
  }

  return validDocs;
};

/**
 * Valider les utilisateurs éligibles à l'assignation
 * @param {Array} userIds - Liste d'IDs utilisateurs
 * @param {Object} session - Session MongoDB
 * @returns {Array} Utilisateurs éligibles
 * @throws {ValidationError} Si utilisateurs non éligibles
 */
const validateEligibleUsers = async (userIds, session = null) => {
  if (userIds.length === 0) return [];

  // Valider format IDs en premier
  validateObjectIds(userIds, "utilisateur");

  // Récupérer les utilisateurs avec leurs détails
  const users = await User.find({ _id: { $in: userIds } })
    .select("nom role actif boutiqueId")
    .session(session)
    .lean();

  // Vérifier éligibilité
  const eligible = [];
  const ineligible = [];

  users.forEach((user) => {
    const reasons = [];

    if (!user.actif) reasons.push("compte désactivé");
    if (user.role !== "boutique_en_attente")
      reasons.push(`rôle "${user.role}" non autorisé`);
    if (user.boutiqueId) reasons.push("déjà assigné à une boutique");

    if (reasons.length === 0) {
      eligible.push(user);
    } else {
      ineligible.push({
        id: user._id,
        nom: user.nom,
        reason: reasons.join(", "),
      });
    }
  });

  // Vérifier les utilisateurs manquants
  const foundIds = users.map((u) => u._id.toString());
  const missing = userIds.filter((id) => !foundIds.includes(id));

  missing.forEach((id) => {
    ineligible.push({
      id,
      nom: "INCONNU",
      reason: "utilisateur non trouvé",
    });
  });

  if (ineligible.length > 0) {
    throw new ValidationError(
      "Utilisateurs non éligibles à l'assignation",
      ineligible
    );
  }

  return eligible;
};

/**
 * Classe d'erreur de validation personnalisée
 */
class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
    this.statusCode = 400;
  }
}

module.exports = {
  validateObjectIds,
  validateActiveDocuments,
  validateEligibleUsers,
  ValidationError,
};
