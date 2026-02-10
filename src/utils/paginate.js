// ============================================
// Utilitaire de pagination et filtres simples
// ============================================

/**
 * Fonction utilitaire pour paginer et filtrer une collection MongoDB
 *
 * @param {Model} model - Modèle Mongoose à requêter
 * @param {Object} query - Objet de requête (req.query)
 * @param {Object} defaultFilters - Filtres par défaut (ex: { actif: true })
 * @param {Array} populateFields - Champs à peupler (optionnel)
 * @returns {Object} Résultat paginé avec métadonnées
 *
 * @example
 * const result = await paginateAndFilter(
 *   Boutique,
 *   req.query,
 *   { actif: true },
 *   ['proprietaire']
 * );
 */
const paginateAndFilter = async (
  model,
  query,
  defaultFilters = {},
  populateFields = []
) => {
  try {
    // ============================================
    // EXTRACTION ET VALIDATION DES PARAMÈTRES
    // ============================================

    // Pagination (valeurs par défaut sécurisées)
    let page = parseInt(query.page) || 1;
    let limit = parseInt(query.limit) || 10;

    // Sécurité: limites maximales
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100); // Max 100 éléments par page

    // Calcul du skip
    const skip = (page - 1) * limit;

    // ============================================
    // EXTRACTION ET SANITISATION DES FILTRES
    // ============================================

    // Copie des filtres utilisateur (exclure page/limit)
    const { page: _, limit: __, ...filters } = query;

    // Obtenir les champs valides du schéma
    const schemaPaths = Object.keys(model.schema.paths);

    // Filtrer uniquement les champs existants dans le schéma
    const validFilters = {};
    for (const [key, value] of Object.entries(filters)) {
      // Ignorer les champs internes et virtuels
      if (
        schemaPaths.includes(key) &&
        !key.startsWith("_") &&
        key !== "id" &&
        value !== undefined &&
        value !== ""
      ) {
        // Conversion automatique des booléens et nombres
        if (value === "true" || value === "false") {
          validFilters[key] = value === "true";
        } else if (!isNaN(value) && value.trim() !== "") {
          validFilters[key] = Number(value);
        } else {
          validFilters[key] = value;
        }
      }
    }

    // Fusionner avec les filtres par défaut
    const queryFilters = { ...defaultFilters, ...validFilters };

    // ============================================
    // EXÉCUTION DES REQUÊTES
    // ============================================

    // Compter le total de documents (sans pagination)
    const totalDocuments = await model.countDocuments(queryFilters);

    // Construire la requête paginée
    let dbQuery = model.find(queryFilters);

    // Appliquer le peuplement si spécifié
    if (populateFields.length > 0) {
      dbQuery = dbQuery.populate(populateFields);
    }

    // Appliquer pagination
    const documents = await dbQuery
      .limit(limit)
      .skip(skip)
      .lean() // Retourner des objets JS purs (meilleures performances)
      .exec();

    // Calculer le nombre total de pages
    const totalPages = Math.ceil(totalDocuments / limit);

    // ============================================
    // RETOURNER LE RÉSULTAT STRUCTURÉ
    // ============================================

    return {
      page,
      limit,
      totalDocuments,
      totalPages,
      filtre: validFilters, // Filtres appliqués (sanitisés)
      documents,
    };
  } catch (error) {
    console.error(" [PaginateUtil] Erreur:", error.message);
    throw new Error(`Erreur de pagination: ${error.message}`);
  }
};

module.exports = paginateAndFilter;
