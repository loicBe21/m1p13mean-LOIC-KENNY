// ============================================
// src/services/categorie.service.js
// Service Catégorie - Logique métier centralisée
// ============================================

const Categorie = require("../models/Categorie");
const paginateAndFilter = require("../utils/paginate");

/**
 * Créer une nouvelle catégorie
 * @param {Object} categorieData - Données de la catégorie
 * @returns {Object} Catégorie créée
 * @throws {Error} Si nom existe déjà ou erreur de validation
 */
const createCategorie = async (categorieData) => {
  try {
    // Vérifier unicité du nom (insensible à la casse)
    const existing = await Categorie.findOne({
      nom: { $regex: new RegExp(`^${categorieData.nom}$`, "i") },
    });

    if (existing) {
      throw new Error("Une catégorie avec ce nom existe déjà");
    }

    const categorie = await Categorie.create(categorieData);
    console.log(` [CategorieService] Catégorie créée: ${categorie.nom}`);
    return categorie;
  } catch (error) {
    console.error(
      " [CategorieService] Erreur createCategorie:",
      error.message
    );
    throw error;
  }
};

/**
 * Obtenir toutes les catégories avec pagination et filtres
 * @param {Object} query - Paramètres de requête (page, limit, filtres)
 * @param {Object} defaultFilters - Filtres par défaut optionnels
 * @returns {Object} Résultat paginé
 */
const getCategoriesPaginated = async (query = {}, defaultFilters = {}) => {
  try {
    console.log(` [CategorieService] Requête paginée avec filtres:`, query);

    const result = await paginateAndFilter(
      Categorie,
      query,
      defaultFilters,
      []
    );

    console.log(
      ` [CategorieService] ${result.documents.length} catégories retournées (page ${result.page}/${result.totalPages})`
    );
    return result;
  } catch (error) {
    console.error(
      " [CategorieService] Erreur getCategoriesPaginated:",
      error.message
    );
    throw error;
  }
};

/**
 * Obtenir une catégorie par ID
 * @param {String} id - ID de la catégorie
 * @returns {Object|null} Catégorie ou null
 */
const getCategorieById = async (id) => {
  try {
    const categorie = await Categorie.findById(id);
    if (categorie)
      console.log(` [CategorieService] Catégorie trouvée: ${categorie.nom}`);
    return categorie;
  } catch (error) {
    console.error(
      " [CategorieService] Erreur getCategorieById:",
      error.message
    );
    throw error;
  }
};

/**
 * Mettre à jour une catégorie
 * @param {String} id - ID de la catégorie
 * @param {Object} updateData - Données de mise à jour
 * @returns {Object} Catégorie mise à jour
 * @throws {Error} Si catégorie non trouvée
 */
const updateCategorie = async (id, updateData) => {
  try {
    // Vérifier unicité du nom si modifié
    if (updateData.nom) {
      const existing = await Categorie.findOne({
        nom: { $regex: new RegExp(`^${updateData.nom}$`, "i") },
        _id: { $ne: id },
      });

      if (existing) {
        throw new Error("Une catégorie avec ce nom existe déjà");
      }
    }

    const categorie = await Categorie.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!categorie) throw new Error("Catégorie non trouvée");

    console.log(
      ` [CategorieService] Catégorie mise à jour: ${categorie.nom}`
    );
    return categorie;
  } catch (error) {
    console.error(
      " [CategorieService] Erreur updateCategorie:",
      error.message
    );
    throw error;
  }
};

/**
 * Supprimer une catégorie
 * @param {String} id - ID de la catégorie
 * @returns {Object} Catégorie supprimée
 * @throws {Error} Si catégorie non trouvée
 */
const deleteCategorie = async (id) => {
  try {
    const categorie = await Categorie.findByIdAndDelete(id);
    if (!categorie) throw new Error("Catégorie non trouvée");

    console.log(` [CategorieService] Catégorie supprimée: ${categorie.nom}`);
    return categorie;
  } catch (error) {
    console.error(
      " [CategorieService] Erreur deleteCategorie:",
      error.message
    );
    throw error;
  }
};

/**
 * Activer une catégorie
 * @param {String} id - ID de la catégorie
 * @returns {Object} Catégorie activée
 */
const activerCategorie = async (id) => {
  try {
    const categorie = await getCategorieById(id);
    if (!categorie) throw new Error("Catégorie non trouvée");

    await categorie.activer();
    console.log(` [CategorieService] Catégorie activée: ${categorie.nom}`);
    return categorie;
  } catch (error) {
    console.error(
      " [CategorieService] Erreur activerCategorie:",
      error.message
    );
    throw error;
  }
};

/**
 * Désactiver une catégorie
 * @param {String} id - ID de la catégorie
 * @returns {Object} Catégorie désactivée
 */
const desactiverCategorie = async (id) => {
  try {
    const categorie = await getCategorieById(id);
    if (!categorie) throw new Error("Catégorie non trouvée");

    await categorie.desactiver();
    console.log(` [CategorieService] Catégorie désactivée: ${categorie.nom}`);
    return categorie;
  } catch (error) {
    console.error(
      " [CategorieService] Erreur desactiverCategorie:",
      error.message
    );
    throw error;
  }
};

/**
 * Obtenir les catégories actives
 * @returns {Array} Catégories actives
 */
const getCategoriesActives = async () => {
  try {
    const categories = await Categorie.find({ actif: true }).sort({ nom: 1 });
    console.log(
      ` [CategorieService] ${categories.length} catégories actives récupérées`
    );
    return categories;
  } catch (error) {
    console.error(
      " [CategorieService] Erreur getCategoriesActives:",
      error.message
    );
    throw error;
  }
};

/**
 * Obtenir les catégories inactives
 * @returns {Array} Catégories inactives
 */
const getCategoriesInactives = async () => {
  try {
    const categories = await Categorie.find({ actif: false }).sort({ nom: 1 });
    console.log(
      ` [CategorieService] ${categories.length} catégories inactives récupérées`
    );
    return categories;
  } catch (error) {
    console.error(
      " [CategorieService] Erreur getCategoriesInactives:",
      error.message
    );
    throw error;
  }
};

// ============================================
// EXPORT
// ============================================

module.exports = {
  createCategorie,
  getCategoriesPaginated,
  getCategorieById,
  updateCategorie,
  deleteCategorie,
  activerCategorie,
  desactiverCategorie,
  getCategoriesActives,
  getCategoriesInactives,
};
