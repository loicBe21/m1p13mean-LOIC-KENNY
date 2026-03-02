// ============================================
// src/utils/responseHandler.js
// Formatage des réponses API - AUCUNE logique métier
// ============================================

/**
 * Formatage réponse succès
 * @param {Object} res - Response Express
 * @param {number} statusCode - Code HTTP
 * @param {string} message - Message utilisateur
 * @param {Object} data - Données métier
 * @param {Object} meta - Métadonnées optionnelles
 */
const success = (res, statusCode = 200, message, data = null, meta = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;

  return res.status(statusCode).json(response);
};

/**
 * Formatage réponse erreur
 * @param {Object} res - Response Express
 * @param {Error|ApiError} error - Erreur à formater
 * @param {number} fallbackStatusCode - Code par défaut si non spécifié
 */
const error = (res, error, fallbackStatusCode = 400) => {
  // ✅ TRANSFORMATION SPÉCIALE POUR LES ERREURS MONGOOSE
  if (error.name === "ValidationError" && !error.details) {
    const details = Object.values(error.errors).map((err) => ({
      field: err.path,
      reason: err.message
        .replace(/^[A-Z][a-z]+ validation failed: [a-z._]+\s*/, "")
        .replace("Path `", "")
        .replace("` ", "")
        .replace(/\.$/, ""),
    }));

    return res.status(400).json({
      success: false,
      message: "Données invalides",
      errors: details,
      timestamp: new Date().toISOString(),
    });
  }

  // Extraire statusCode (priorité: ApiError > fallback)
  const statusCode = error.statusCode || fallbackStatusCode;

  // Extraire message (priorité: ApiError.message > error.message > générique)
  const message = error.message || "Une erreur est survenue";

  // Extraire détails (priorité: ApiError.details > tableau vide)
  const details = error.details || [];

  // Formatage minimaliste et uniforme
  const response = {
    success: false,
    message,
    errors: details,
    timestamp: new Date().toISOString(),
  };

  // En développement uniquement : ajouter debug info
  if (process.env.NODE_ENV === "development") {
    response.debug = {
      name: error.name,
      code: error.code || "N/A",
      ...(error.stack && { stack: error.stack.split("\n").slice(0, 3) }),
    };
  }

  return res.status(statusCode).json(response);
};

module.exports = { success, error };
