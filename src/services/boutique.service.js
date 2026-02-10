// ============================================
// src/services/boutique.service.js
// Service Boutique - Logique métier centralisée
// ============================================

const Boutique = require("../models/boutique");
const User = require("../models/User");
const paginateAndFilter = require("../utils/paginate");

/**
 * Créer une nouvelle boutique
 * @param {Object} boutiqueData - Données de la boutique
 * @returns {Object} Boutique créée
 * @throws {Error} Si email existe déjà ou erreur de validation
 */
const createBoutique = async (boutiqueData) => {
  try {
    // Vérifier unicité email
    const existing = await Boutique.findOne({ email: boutiqueData.email });
    if (existing) {
      throw new Error("Cet email est déjà utilisé par une autre boutique");
    }

    // Créer la boutique
    const boutique = await Boutique.create(boutiqueData);
    console.log(` [BoutiqueService] Boutique créée: ${boutique.nom}`);
    return boutique;
  } catch (error) {
    console.error(" [BoutiqueService] Erreur createBoutique:", error.message);
    throw error;
  }
};

/**
 * Obtenir toutes les boutiques
 * @param {Object} filters - Filtres optionnels (actif, etc.)
 * @returns {Array} Liste des boutiques
 */
const getAllBoutiques = async (filters = {}) => {
  try {
    const boutiques = await Boutique.find(filters).sort({ nom: 1 });
    console.log(
      ` [BoutiqueService] ${boutiques.length} boutiques récupérées`
    );
    return boutiques;
  } catch (error) {
    console.error(
      " [BoutiqueService] Erreur getAllBoutiques:",
      error.message
    );
    throw error;
  }
};

/**
 * Obtenir une boutique par ID
 * @param {String} id - ID de la boutique
 * @returns {Object|null} Boutique ou null
 */
const getBoutiqueById = async (id) => {
  try {
    const boutique = await Boutique.findById(id);
    if (boutique)
      console.log(` [BoutiqueService] Boutique trouvée: ${boutique.nom}`);
    return boutique;
  } catch (error) {
    console.error(
      "❌ [BoutiqueService] Erreur getBoutiqueById:",
      error.message
    );
    throw error;
  }
};

/**
 * Mettre à jour une boutique
 * @param {String} id - ID de la boutique
 * @param {Object} updateData - Données de mise à jour
 * @returns {Object} Boutique mise à jour
 * @throws {Error} Si boutique non trouvée
 */
const updateBoutique = async (id, updateData) => {
  try {
    const boutique = await Boutique.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!boutique) throw new Error("Boutique non trouvée");

    console.log(` [BoutiqueService] Boutique mise à jour: ${boutique.nom}`);
    return boutique;
  } catch (error) {
    console.error(" [BoutiqueService] Erreur updateBoutique:", error.message);
    throw error;
  }
};

/**
 * Supprimer une boutique
 * @param {String} id - ID de la boutique
 * @returns {Object} Boutique supprimée
 * @throws {Error} Si boutique non trouvée
 */
const deleteBoutique = async (id) => {
  try {
    const boutique = await Boutique.findByIdAndDelete(id);
    if (!boutique) throw new Error("Boutique non trouvée");

    console.log(` [BoutiqueService] Boutique supprimée: ${boutique.nom}`);
    return boutique;
  } catch (error) {
    console.error(" [BoutiqueService] Erreur deleteBoutique:", error.message);
    throw error;
  }
};

/**
 * Rechercher des boutiques
 * @param {String} query - Terme de recherche
 * @returns {Array} Boutiques correspondantes
 */
const searchBoutiques = async (query) => {
  try {
    const boutiques = await Boutique.find({
      $or: [{ nom: new RegExp(query, "i") }, { email: new RegExp(query, "i") }],
    }).sort({ nom: 1 });

    console.log(
      ` [BoutiqueService] ${boutiques.length} résultats pour "${query}"`
    );
    return boutiques;
  } catch (error) {
    console.error(
      " [BoutiqueService] Erreur searchBoutiques:",
      error.message
    );
    throw error;
  }
};

/**
 * Obtenir les boutiques actives
 * @returns {Array} Boutiques actives
 */
const getBoutiquesActives = async () => {
  try {
    const boutiques = await Boutique.find({ actif: true }).sort({ nom: 1 });
    console.log(
      ` [BoutiqueService] ${boutiques.length} boutiques actives récupérées`
    );
    return boutiques;
  } catch (error) {
    console.error(
      " [BoutiqueService] Erreur getBoutiquesActives:",
      error.message
    );
    throw error;
  }
};

/**
 * Obtenir les boutiques inactives
 * @returns {Array} Boutiques inactives
 */
const getBoutiquesInactives = async () => {
  try {
    const boutiques = await Boutique.find({ actif: false }).sort({ nom: 1 });
    console.log(
      ` [BoutiqueService] ${boutiques.length} boutiques inactives récupérées`
    );
    return boutiques;
  } catch (error) {
    console.error(
      " [BoutiqueService] Erreur getBoutiquesInactives:",
      error.message
    );
    throw error;
  }
};

/**
 * Activer une boutique
 * @param {String} id - ID de la boutique
 * @returns {Object} Boutique activée
 */
const activerBoutique = async (id) => {
  try {
    const boutique = await getBoutiqueById(id);
    if (!boutique) throw new Error("Boutique non trouvée");

    await boutique.activer();
    console.log(` [BoutiqueService] Boutique activée: ${boutique.nom}`);
    return boutique;
  } catch (error) {
    console.error(
      " [BoutiqueService] Erreur activerBoutique:",
      error.message
    );
    throw error;
  }
};

/**
 * Désactiver une boutique
 * @param {String} id - ID de la boutique
 * @returns {Object} Boutique désactivée
 */
const desactiverBoutique = async (id) => {
  try {
    const boutique = await getBoutiqueById(id);
    if (!boutique) throw new Error("Boutique non trouvée");

    await boutique.desactiver();
    console.log(` [BoutiqueService] Boutique désactivée: ${boutique.nom}`);
    return boutique;
  } catch (error) {
    console.error(
      " [BoutiqueService] Erreur desactiverBoutique:",
      error.message
    );
    throw error;
  }
};





/**
 * Obtenir toutes les boutiques avec pagination et filtres
 * @param {Object} query - Paramètres de requête (page, limit, filtres)
 * @param {Object} defaultFilters - Filtres par défaut optionnels
 * @returns {Object} Résultat paginé
 */
const getBoutiquesPaginated = async (query = {}, defaultFilters = {}) => {
  try {
    console.log(`🔍 [BoutiqueService] Requête paginée avec filtres:`, query);

    // Appliquer la pagination et les filtres
    const result = await paginateAndFilter(
      Boutique,
      query,
      defaultFilters,
      [] // Pas de populate nécessaire pour les boutiques
    );

    console.log(
      ` [BoutiqueService] ${result.documents.length} boutiques retournées (page ${result.page}/${result.totalPages})`
    );

    return result;
  } catch (error) {
    console.error(
      " [BoutiqueService] Erreur getBoutiquesPaginated:",
      error.message
    );
    throw error;
  }
};






/**
 * Assigner un utilisateur boutique à une boutique
 * @param {String} boutiqueId - ID de la boutique
 * @param {String} userId - ID de l'utilisateur
 * @returns {Object} Utilisateur mis à jour
 * @throws {Error} Si validation échoue
 */
const assignUserToBoutique = async (boutiqueId, userId) => {
  try {
    console.log(` [BoutiqueService] Assignation utilisateur ${userId} à boutique ${boutiqueId}`);
    
    // Vérifier que la boutique existe
    const boutique = await Boutique.findById(boutiqueId);
    if (!boutique) {
      throw new Error('Boutique non trouvée');
    }
    
    // Vérifier que l'utilisateur existe et a le rôle "boutique"
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    if (user.role !== 'boutique') {
      throw new Error('L\'utilisateur doit avoir le rôle "boutique"');
    }
    
    // Vérifier que l'utilisateur n'est pas déjà assigné à une autre boutique
    if (user.boutiqueId && user.boutiqueId.toString() !== boutiqueId) {
      throw new Error('Cet utilisateur est déjà assigné à une autre boutique');
    }
    
    // Mettre à jour le boutiqueId de l'utilisateur
    user.boutiqueId = boutiqueId;
    await user.save();
    
    console.log(` [BoutiqueService] Utilisateur ${user.nom} assigné à ${boutique.nom}`);
    return user;
    
  } catch (error) {
    console.error(' [BoutiqueService] Erreur assignUserToBoutique:', error.message);
    throw error;
  }
};




// ============================================
// EXPORT
// ============================================

module.exports = {
  createBoutique,
  getAllBoutiques,
  getBoutiqueById,
  updateBoutique,
  deleteBoutique,
  searchBoutiques,
  getBoutiquesActives,
  getBoutiquesInactives,
  activerBoutique,
  desactiverBoutique,
  getBoutiquesPaginated,
  assignUserToBoutique,
};
