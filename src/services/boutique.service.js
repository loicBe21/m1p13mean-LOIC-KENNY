// ============================================
// src/services/boutique.service.js
// Service Boutique - Logique métier centralisée
// ============================================

const Boutique = require("../models/Boutique");
const User = require("../models/User");
const Categorie = require("../models/Categorie");

const paginateAndFilter = require("../utils/paginate");
const mongoose = require("mongoose");


const {
  validateObjectIds,
  validateActiveDocuments,
  validateEligibleUsers,
  ValidationError,
} = require("../utils/validationHelpers");


const {
  createForbiddenError,
  createNotFoundError,
} = require("../utils/apiError");

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
      " [BoutiqueService] Erreur getBoutiqueById:",
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
    console.log(` [BoutiqueService] Requête paginée avec filtres:`, query);

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






/**
 * Valider et préparer les catégories pour assignation
 */
const _prepareCategories = async (categoryIds = [], session) => {
  if (categoryIds.length === 0) return [];
  
  validateObjectIds(categoryIds, 'catégorie');
  await validateActiveDocuments(Categorie, categoryIds, 'Catégories', session);
  
  return categoryIds;
};

/**
 * Valider et préparer les utilisateurs pour assignation
 */
const _prepareUsers = async (userIds = [], session) => {
  if (userIds.length === 0) return [];
  
  const eligibleUsers = await validateEligibleUsers(userIds, session);
  return eligibleUsers.map(user => user._id);
};

/**
 * Créer la boutique dans la transaction
 */
const _createBoutiqueInTransaction = async (boutiqueData, categoryIds, session) => {
  const [boutique] = await Boutique.create([{
    ...boutiqueData,
    categories: categoryIds
  }], { session });
  
  console.log(`✅ Boutique créée: ${boutique._id} (${boutique.nom})`);
  return boutique;
};

/**
 * Assigner les utilisateurs à la boutique dans la transaction
 */
const _assignUsersInTransaction = async (userIds, boutiqueId, session) => {
  if (userIds.length === 0) return 0;
  
  const result = await User.updateMany(
    { _id: { $in: userIds } },
    { 
      $set: { 
        role: 'boutique',
        boutiqueId: boutiqueId 
      } 
    },
    { session }
  );
  
  console.log(`✅ ${result.modifiedCount} utilisateur(s) assigné(s)`);
  return result.modifiedCount;
};

/**
 * Récupérer la boutique enrichie avec relations
 */
const _getEnrichedBoutique = async (boutiqueId) => {
  return await Boutique.findById(boutiqueId)
    .populate('categories', 'nom description')
    .lean();
};

// ════════════════════════════════════════════════════════════════
// MÉTHODES PUBLIQUES - CLEAN & ROBUSTES
// ════════════════════════════════════════════════════════════════

/**
 * Créer une boutique avec relations optionnelles
 * @workflow Flexible: users/categories optionnels
 * @security Uniquement users "boutique_en_attente" actifs
 * @transaction Atomique: tout ou rien
 */
const createBoutiqueWithRelations = async (boutiqueData, userIds = [], categoryIds = []) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  console.log('\n' + '🔧'.repeat(35));
  console.log(`🚀 CRÉATION BOUTIQUE : ${boutiqueData.nom || 'SANS NOM'}`);
  console.log(`   Users: ${userIds.length} | Catégories: ${categoryIds.length}`);
  console.log('🔧'.repeat(35) + '\n');

  try {
    // ════════════════════════════════════════════════════════════
    // VALIDATION PRÉALABLE (rapide, avant transaction)
    // ════════════════════════════════════════════════════════════
    
    validateObjectIds(userIds, 'utilisateur');
    validateObjectIds(categoryIds, 'catégorie');
    
    // ════════════════════════════════════════════════════════════
    // OPÉRATIONS DANS LA TRANSACTION
    // ════════════════════════════════════════════════════════════
    
    const preparedCategories = await _prepareCategories(categoryIds, session);
    const preparedUsers = await _prepareUsers(userIds, session);
    
    const boutique = await _createBoutiqueInTransaction(
      boutiqueData, 
      preparedCategories, 
      session
    );
    
    const usersAssignes = await _assignUsersInTransaction(
      preparedUsers, 
      boutique._id, 
      session
    );
    
    await session.commitTransaction();
    session.endSession();
    
    // ════════════════════════════════════════════════════════════
    // RÉPONSE STRUCTURÉE
    // ════════════════════════════════════════════════════════════
    
    const boutiqueComplete = await _getEnrichedBoutique(boutique._id);
    
    console.log('\n' + '✅'.repeat(35));
    console.log(`✅ BOUTIQUE CRÉÉE : ${boutique.nom}`);
    console.log(`   Users assignés: ${usersAssignes}`);
    console.log(`   Catégories: ${preparedCategories.length}`);
    console.log('✅'.repeat(35) + '\n');
    
    return {
      success: true,
      boutique: boutiqueComplete,
      statistiques: {
        usersAssignes,
        categoriesAssignees: preparedCategories.length
      },
      message: `Boutique "${boutique.nom}" créée avec succès`
    };
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    // Relancer pour traitement par le contrôleur
    throw error;
  }
};

/**
 * Mettre à jour une boutique avec gestion fine des relations
 * @workflow Flexible: users/categories optionnels (null = ne pas modifier)
 * @security Protection admins, validation stricte éligibilité
 * @transaction Atomique: tout ou rien
 */
const updateBoutiqueWithRelations = async (id, boutiqueData, userIds = null, categoryIds = null) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  console.log('\n' + '✏️'.repeat(35));
  console.log(`✏️  MISE À JOUR BOUTIQUE : ${id}`);
  console.log(`   Users update: ${userIds !== null ? userIds.length : 'non modifié'}`);
  console.log(`   Categories update: ${categoryIds !== null ? categoryIds.length : 'non modifié'}`);
  console.log('✏️'.repeat(35) + '\n');

  try {
    // ════════════════════════════════════════════════════════════
    // VÉRIFICATION EXISTENCE BOUTIQUE
    // ════════════════════════════════════════════════════════════
    
    const boutiqueExistante = await Boutique.findById(id).session(session);
    if (!boutiqueExistante) {
      throw new ValidationError('Boutique non trouvée', [{ id, reason: 'ID inexistant' }]);
    }
    
    // ════════════════════════════════════════════════════════════
    // PRÉPARATION DES DONNÉES DE MISE À JOUR
    // ════════════════════════════════════════════════════════════
    
    let updateData = { ...boutiqueData };
    
    // Catégories (null = ne pas modifier)
    if (categoryIds !== null) {
      const preparedCategories = await _prepareCategories(categoryIds, session);
      updateData.categories = preparedCategories;
    }
    
    // ════════════════════════════════════════════════════════════
    // MISE À JOUR DE LA BOUTIQUE
    // ════════════════════════════════════════════════════════════
    
    const boutique = await Boutique.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, session }
    );
    
    if (!boutique) {
      throw new ValidationError('Échec mise à jour boutique', []);
    }
    
    console.log(`✅ Boutique mise à jour: ${boutique.nom}`);
    
    // ════════════════════════════════════════════════════════════
    // GESTION DES UTILISATEURS (null = ne pas modifier)
    // ════════════════════════════════════════════════════════════
    
    let usersStats = { added: 0, removed: 0 };
    
    if (userIds !== null) {
      // Récupérer utilisateurs actuellement assignés
      const usersActuels = await User.find({ 
        boutiqueId: id, 
        role: 'boutique' 
      }).session(session);
      
      const userIdsActuels = usersActuels.map(u => u._id.toString());
      
      // Utilisateurs à supprimer (protection admins)
      const toRemove = userIdsActuels.filter(id => !userIds.includes(id));
      if (toRemove.length > 0) {
        const admins = await User.find({ 
          _id: { $in: toRemove }, 
          role: 'admin' 
        }).session(session);
        
        if (admins.length > 0) {
          throw new ValidationError(
            'Protection administrateur',
            admins.map(admin => ({
              id: admin._id,
              nom: admin.nom,
              reason: 'Impossible de retirer un administrateur de sa boutique'
            }))
          );
        }
        
        await User.updateMany(
          { _id: { $in: toRemove } },
          { boutiqueId: null },
          { session }
        );
        usersStats.removed = toRemove.length;
        console.log(`🗑️  ${usersStats.removed} utilisateur(s) retiré(s)`);
      }
      
      // Utilisateurs à ajouter
      const toAdd = userIds.filter(id => !userIdsActuels.includes(id));
      if (toAdd.length > 0) {
        const preparedUsers = await _prepareUsers(toAdd, session);
        await User.updateMany(
          { _id: { $in: preparedUsers } },
          { 
            $set: { 
              role: 'boutique',
              boutiqueId: id 
            } 
          },
          { session }
        );
        usersStats.added = preparedUsers.length;
        console.log(`➕ ${usersStats.added} utilisateur(s) ajouté(s)`);
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    // ════════════════════════════════════════════════════════════
    // RÉPONSE STRUCTURÉE
    // ════════════════════════════════════════════════════════════
    
    const boutiqueComplete = await _getEnrichedBoutique(id);
    
    console.log('\n' + '✅'.repeat(35));
    console.log(`✅ BOUTIQUE MISE À JOUR : ${boutique.nom}`);
    console.log(`   Users: +${usersStats.added} -${usersStats.removed}`);
    console.log(`   Catégories: ${boutique.categories?.length || 0}`);
    console.log('✅'.repeat(35) + '\n');
    
    return {
      success: true,
      boutique: boutiqueComplete,
      statistiques: {
        usersAdded: usersStats.added,
        usersRemoved: usersStats.removed,
        categoriesCount: boutique.categories?.length || 0
      },
      message: `Boutique "${boutique.nom}" mise à jour avec succès`
    };
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    // Relancer pour traitement par le contrôleur
    throw error;
  }
};




/**
 * Récupérer la boutique de l'utilisateur authentifié avec catégories peuplées
 * @param {String} userId - ID utilisateur authentifié
 * @returns {Object} Boutique avec catégories complètes
 */
const getMyBoutique = async (userId) => {
  // ============================================
  // 1. VÉRIFICATION UTILISATEUR ET RÔLE
  // ============================================
  const user = await User.findById(userId)
    .select('role boutiqueId')
    .lean();
  
  if (!user) {
    throw createNotFoundError('Utilisateur', userId);
  }
  
  if (user.role !== 'boutique' || !user.boutiqueId) {
    throw createForbiddenError(
      'Accès réservé aux utilisateurs boutique avec boutique associée'
    );
  }
  
  // ============================================
  // 2. RÉCUPÉRATION BOUTIQUE AVEC CATÉGORIES PEUPLÉES
  // ============================================
  const boutique = await Boutique.findById(user.boutiqueId)
    .populate({
      path: 'categories',
      select: '_id nom description parent actif createdAt updatedAt',
      options: { sort: { nom: 1 } } // Tri alphabétique
    })
    .lean();
  
  if (!boutique) {
    throw createNotFoundError('Boutique', user.boutiqueId.toString());
  }
  
  return boutique;
};








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
  createBoutiqueWithRelations,
  updateBoutiqueWithRelations,
  getMyBoutique,
};
