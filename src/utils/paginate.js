// ============================================
// src/utils/paginate.js
// Pagination robuste - Gère tous les cas (sans filtre, types mixtes)
// ============================================

require("dotenv").config();

// Récupérer limites depuis .env avec valeurs par défaut sécurisées
const DEFAULT_PUBLIC_LIMIT =
  parseInt(process.env.PAGINATION_LIMIT_PUBLIC) || 12;
const DEFAULT_BACKOFFICE_LIMIT =
  parseInt(process.env.PAGINATION_LIMIT_BACKOFFICE) || 20;
const MAX_LIMIT = parseInt(process.env.PAGINATION_MAX_LIMIT) || 50;

/**
 * Nettoyer et normaliser une valeur de filtre
 * @param {*} value - Valeur à nettoyer (string, number, boolean, etc.)
 * @returns {*} Valeur nettoyée et typée
 */
const cleanFilterValue = (value) => {
  // Ignorer valeurs vides
  if (value === undefined || value === null || value === "") {
    return null;
  }

  // Booléens déjà typés → garder tels quels
  if (typeof value === "boolean") {
    return value;
  }

  // Nombres déjà typés → garder tels quels
  if (typeof value === "number") {
    return value;
  }

  // ObjectId Mongoose → garder tel quel
  if (value instanceof require("mongoose").Types.ObjectId) {
    return value;
  }

  // Chaînes de caractères → nettoyer et convertir si nécessaire
  if (typeof value === "string") {
    const trimmed = value.trim();

    // Conversion booléen
    if (trimmed.toLowerCase() === "true") return true;
    if (trimmed.toLowerCase() === "false") return false;

    // Conversion nombre
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== "") return num;

    // Retourner chaîne nettoyée
    return trimmed;
  }

  // Autres types → retourner tel quel (Date, Array, etc.)
  return value;
};

/**
 * Pagination générique robuste
 * @param {Model} model - Modèle Mongoose
 * @param {Object} query - Paramètres de requête (page, filtres)
 * @param {Object} defaultFilters - Filtres par défaut (optionnel)
 * @param {Array} populateFields - Champs à peupler (optionnel)
 * @param {String} context - 'public' ou 'backoffice'
 * @returns {Object} Résultat paginé
 */
const paginateAndFilter = async (
  model,
  query = {},
  defaultFilters = {},
  populateFields = [],
  context = "public"
) => {
  try {
    // ============================================
    // 1. CONFIGURATION PAGINATION
    // ============================================

    // Déterminer limite par défaut selon contexte
    const defaultLimit =
      context === "backoffice"
        ? DEFAULT_BACKOFFICE_LIMIT
        : DEFAULT_PUBLIC_LIMIT;

    // Extraire page et limit (sécurisés)
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(
      Math.max(1, parseInt(query.limit) || defaultLimit),
      MAX_LIMIT
    );

    const skip = (page - 1) * limit;

    // ============================================
    // 2. CONSTRUCTION FILTRES SÉCURISÉS
    // ============================================

    // Combiner filtres par défaut + query (sans page/limit)
    const { page: _, limit: __, ...rawFilters } = query;
    const combinedFilters = { ...defaultFilters, ...rawFilters };

    // Nettoyer chaque valeur de filtre avec gestion de type
    const validFilters = {};
    for (const [key, value] of Object.entries(combinedFilters)) {
      const cleaned = cleanFilterValue(value);
      if (cleaned !== null) {
        validFilters[key] = cleaned;
      }
    }

    // ============================================
    // 3. EXÉCUTION REQUÊTE
    // ============================================

    // Compter documents (avec filtres nettoyés)
    const totalDocuments = await model.countDocuments(validFilters);

    // Construire requête
    let dbQuery = model.find(validFilters);

    // Appliquer populate si nécessaire
    if (populateFields.length > 0) {
      dbQuery = dbQuery.populate(populateFields);
    }

    // Appliquer pagination
    const documents = await dbQuery.limit(limit).skip(skip).lean().exec();

    // Calculer pages totales
    const totalPages = Math.ceil(totalDocuments / limit);

    // ============================================
    // 4. RETOUR STRUCTURÉ
    // ============================================

    return {
      page,
      limit,
      totalDocuments,
      totalPages,
      filtre: validFilters, // Filtres appliqués (nettoyés)
      documents,
    };
  } catch (error) {
    console.error("❌ [PaginateUtil] Erreur:", {
      message: error.message,
      stack: error.stack?.split("\n").slice(0, 2),
      query: query,
      context: context,
    });
    throw new Error(`Erreur de pagination: ${error.message}`);
  }
};

module.exports = paginateAndFilter;
