// ============================================
// src/services/categorie.service.js
// Service Catégorie - Logique métier centralisée
// ============================================

const Categorie = require("../models/Categorie");
const Produit = require("../models/Produit");
const paginateAndFilter = require("../utils/paginate");
const { ApiError, createNotFoundError } = require("../utils/apiError");

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
 * Récupérer toutes les catégories avec le nombre de produits actifs/publiés
 * @returns {Promise<Array>} Liste des catégories avec comptage
 */
const getCategoriesWithProductCount = async () => {
  try {
    // ============================================
    // ÉTAPE 1 : AGGRÉGATION MONGODB POUR COMPTER LES PRODUITS
    // ============================================
    
    const categories = await Categorie.aggregate([
      // Jointure avec la collection produits
      {
        $lookup: {
          from: 'produits', // Nom de la collection Produit (Mongoose pluralise automatiquement)
          let: { categoryId: '$_id' }, // Variable pour la catégorie courante
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$categorieId', '$$categoryId'] }, // Produits de cette catégorie
                    { $eq: ['$actif', true] },                 // Produits actifs
                    { $eq: ['$publierSurLeWeb', true] }        // Produits publiés
                  ]
                }
              }
            }
          ],
          as: 'products' // Résultat stocké dans le champ "products"
        }
      },
      
      // Projection des champs nécessaires + comptage
      {
        $project: {
          _id: 1,
          nom: 1,
          description: 1,
          produitCount: { $size: '$products' } // Compte les produits filtrés
        }
      },
      
      // Tri alphabétique
      { $sort: { nom: 1 } }
    ]);

    // ============================================
    // ÉTAPE 2 : CALCULER LE TOTAL GLOBAL
    // ============================================
    
    const totalProducts = categories.reduce((sum, cat) => sum + cat.produitCount, 0);

    // ============================================
    // ÉTAPE 3 : CRÉER LA CATÉGORIE VIRTUELLE "TOUS LES PRODUITS"
    // ============================================
    
    const allCategory = {
      _id: 'all',
      nom: 'Tous les produits',
      description: 'Tous nos produits disponibles',
      produitCount: totalProducts
    };

    // ============================================
    // ÉTAPE 4 : RETOURNER LE RÉSULTAT FINAL
    // ============================================
    
    return [allCategory, ...categories];
    
  } catch (error) {
    console.error('❌ [CategorieService] Erreur getCategoriesWithProductCount:', error);
    throw new ApiError(
      'Erreur lors de la récupération des catégories',
      500,
      [{ reason: 'Une erreur technique est survenue' }],
      'CATEGORY_FETCH_ERROR'
    );
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
  getCategoriesWithProductCount,
};
