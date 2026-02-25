// ============================================
// src/utils/errorFormatter.js
// Formatage élégant des erreurs pour le client
// ============================================

const { ValidationError } = require("./validationHelpers");

/**
 * Formater une erreur pour la réponse API
 * @param {Error} error - Erreur à formater
 * @param {String} context - Contexte de l'opération (optionnel)
 * @returns {Object} Objet erreur formaté
 */
const formatErrorForClient = (error, context = "Opération") => {
  // Erreurs de validation personnalisées
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: error.message,
      details: error.details.map((detail) => ({
        id: detail.id || "INCONNU",
        nom: detail.nom || undefined,
        reason: detail.reason,
      })),
    };
  }

  // Erreurs Mongoose
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) =>
      err.message.replace(/^[A-Z][a-z]+ validation failed: [a-z._]+\s*/, "")
    );
    return {
      success: false,
      error: `${context} échouée : ${messages.join(" ; ")}`,
    };
  }

  if (error.code === 11000) {
    if (error.keyPattern?.email) {
      return {
        success: false,
        error: "Cet email est déjà utilisé par une autre boutique",
      };
    }
    return {
      success: false,
      error: "Données en doublon détectées",
    };
  }

  // Erreurs MongoDB génériques
  if (error.name === "CastError") {
    return {
      success: false,
      error: `ID invalide : ${error.value}`,
    };
  }

  // Erreur inconnue (ne pas exposer de détails sensibles)
  console.error("Erreur non gérée:", error);
  return {
    success: false,
    error: `${context} échouée : une erreur inattendue s'est produite`,
  };
};

module.exports = { formatErrorForClient };
