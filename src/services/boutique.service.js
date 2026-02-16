// ============================================
// src/services/boutique.service.js
// Service Boutique - Logique métier centralisée
// ============================================

const Boutique = require("../models/Boutique");
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





// ════════════════════════════════════════════════════════════════
// FONCTIONS PRIVÉES SPÉCIALISÉES POUR LA CREATIO ET UPDATE BOUTIQUE AVEC LES RELATION CATEGORIE ET USERS
// ════════════════════════════════════════════════════════════════

/**
 * Valide l'existence et l'activité des catégories
 * @private
 */
const _validateCategories = async (categoryIds, session) => {
  if (categoryIds.length === 0) return;
  
  const categoriesValid = await Categorie.find(
    { _id: { $in: categoryIds }, actif: true },
    null,
    { session }
  );
  
  if (categoriesValid.length !== categoryIds.length) {
    const invalidCount = categoryIds.length - categoriesValid.length;
    throw new Error(`"${invalidCount}" catégorie(s) invalide(s) ou inactives`);
  }
  
  console.log(` ${categoriesValid.length} catégorie(s) validée(s)`);
};

/**
 * Crée la boutique avec les catégories associées
 * @private
 */
const _createBoutique = async (boutiqueData, categoryIds, session) => {
  const [boutique] = await Boutique.create([{
    ...boutiqueData,
    categories: categoryIds
  }], { session });
  
  console.log(` Boutique créée: ${boutique._id} (${boutique.nom})`);
  return boutique;
};

/**
 * Assigner les utilisateurs à la boutique (rôles "en_attente" → "boutique")
 * @private
 */
const _assignUsersToBoutique = async (userIds, boutiqueId, session) => {
  if (userIds.length === 0) return 0;
  
  // Vérifier éligibilité des utilisateurs
  const usersEligibles = await User.find({
    _id: { $in: userIds },
    $or: [
      { role: 'boutique_en_attente' },
      { role: 'boutique', boutiqueId: null }
    ],
    actif: true
  }).session(session);
  
  if (usersEligibles.length !== userIds.length) {
    const ineligibles = userIds.length - usersEligibles.length;
    throw new Error(`"${ineligibles}" utilisateur(s) non éligible(s) à l'assignation`);
  }
  
  // Mise à jour atomique
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
  
  console.log(` ${result.modifiedCount} utilisateur(s) assigné(s)`);
  return result.modifiedCount;
};

/**
 * Récupère la boutique avec relations peuplées
 * @private
 */
const _getBoutiqueWithRelations = async (boutiqueId) => {
  return await Boutique.findById(boutiqueId)
    .populate('categories', 'nom description')
    .lean();
};

/**
 * Gérer la mise à jour des utilisateurs (ajout/suppression)
 * @private
 */
const _updateUsersRelations = async (boutiqueId, newUserIds, session) => {
  if (newUserIds === null) return { added: 0, removed: 0 };
  
  // Récupérer les utilisateurs actuellement assignés
  const usersActuels = await User.find({ 
    boutiqueId: boutiqueId, 
    role: 'boutique' 
  }).session(session);
  
  const userIdsActuels = usersActuels.map(u => u._id.toString());
  
  // Utilisateurs à supprimer
  const toRemove = userIdsActuels.filter(id => !newUserIds.includes(id));
  let removed = 0;
  if (toRemove.length > 0) {
    const result = await User.updateMany(
      { _id: { $in: toRemove } },
      { boutiqueId: null },
      { session }
    );
    removed = result.modifiedCount;
    console.log(`  ${removed} utilisateur(s) retiré(s)`);
  }
  
  // Utilisateurs à ajouter
  const toAdd = newUserIds.filter(id => !userIdsActuels.includes(id));
  let added = 0;
  if (toAdd.length > 0) {
    // Vérifier éligibilité
    const usersEligibles = await User.find({
      _id: { $in: toAdd },
      $or: [
        { role: 'boutique_en_attente' },
        { role: 'boutique', boutiqueId: null }
      ],
      actif: true
    }).session(session);
    
    if (usersEligibles.length !== toAdd.length) {
      throw new Error('Certains utilisateurs ne sont pas éligibles à l\'assignation');
    }
    
    const result = await User.updateMany(
      { _id: { $in: toAdd } },
      { 
        $set: { 
          role: 'boutique',
          boutiqueId: boutiqueId 
        } 
      },
      { session }
    );
    added = result.modifiedCount;
    console.log(` ${added} utilisateur(s) ajouté(s)`);
  }
  
  return { added, removed };
};

// ════════════════════════════════════════════════════════════════
// MÉTHODES PUBLIQUES
// ════════════════════════════════════════════════════════════════

/**
 * Créer une boutique avec gestion complète des relations
 * @param {Object} boutiqueData - Données de la boutique
 * @param {Array} userIds - Liste d'IDs d'utilisateurs à assigner
 * @param {Array} categoryIds - Liste d'IDs de catégories
 * @returns {Object} Résultat structuré avec statistiques
 */
const createBoutiqueWithRelations = async (boutiqueData, userIds = [], categoryIds = []) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  console.log('\n' + ''.repeat(30));
  console.log(` DÉMARRAGE CRÉATION BOUTIQUE : ${boutiqueData.nom}`);
  console.log(`   Utilisateurs: ${userIds.length} | Catégories: ${categoryIds.length}`);
  console.log(''.repeat(30) + '\n');

  try {
    // ════════════════════════════════════════════════════════════
    // FLUX PRINCIPAL : APPEL DES FONCTIONS SPÉCIALISÉES
    // ════════════════════════════════════════════════════════════
    
    await _validateCategories(categoryIds, session);
    const boutique = await _createBoutique(boutiqueData, categoryIds, session);
    const usersAssignes = await _assignUsersToBoutique(userIds, boutique._id, session);
    
    await session.commitTransaction();
    session.endSession();
    
    const boutiqueComplete = await _getBoutiqueWithRelations(boutique._id);
    
    // ════════════════════════════════════════════════════════════
    // RETOUR STRUCTURÉ ET CLAIR
    // ════════════════════════════════════════════════════════════
    
    console.log('\n' + ''.repeat(30));
    console.log(' CRÉATION BOUTIQUE TERMINÉE AVEC SUCCÈS');
    console.log(''.repeat(30) + '\n');
    
    return {
      success: true,
      boutique: boutiqueComplete,
      statistiques: {
        usersAssignes,
        categoriesAssignees: categoryIds.length,
        totalOperations: usersAssignes + categoryIds.length
      },
      message: `Boutique "${boutique.nom}" créée avec ${usersAssignes} utilisateur(s) et ${categoryIds.length} catégorie(s)`
    };
    
  } catch (error) {
    // ════════════════════════════════════════════════════════════
    // GESTION D'ERREURS CENTRALISÉE
    // ════════════════════════════════════════════════════════════
    
    await session.abortTransaction();
    session.endSession();
    
    const context = {
      boutique: boutiqueData?.nom || 'INCONNUE',
      usersCount: userIds?.length || 0,
      categoriesCount: categoryIds?.length || 0,
      errorType: error.name,
      errorMessage: error.message
    };
    
    console.error('\n ÉCHEC CRÉATION BOUTIQUE');
    console.error(''.repeat(30));
    console.error('Contexte:', JSON.stringify(context, null, 2));
    console.error('Erreur:', error.stack || error.message);
    console.error(''.repeat(30) + '\n');
    
    throw new Error(`Impossible de créer la boutique "${context.boutique}": ${error.message}`);
  }
};

/**
 * Mettre à jour une boutique avec gestion complète des relations
 * @param {String} id - ID de la boutique
 * @param {Object} boutiqueData - Données de mise à jour
 * @param {Array|null} userIds - Nouvelle liste d'IDs utilisateurs (null = ne pas modifier)
 * @param {Array|null} categoryIds - Nouvelle liste d'IDs catégories (null = ne pas modifier)
 * @returns {Object} Résultat structuré avec statistiques
 */
const updateBoutiqueWithRelations = async (id, boutiqueData, userIds = null, categoryIds = null) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  console.log('\n' + ''.repeat(30));
  console.log(`  DÉMARRAGE MISE À JOUR BOUTIQUE : ${id}`);
  console.log(`   Users update: ${userIds !== null ? userIds.length : 'skip'}`);
  console.log(`   Categories update: ${categoryIds !== null ? categoryIds.length : 'skip'}`);
  console.log(''.repeat(30) + '\n');

  try {
    // ════════════════════════════════════════════════════════════
    // VÉRIFICATION BOUTIQUE EXISTANTE
    // ════════════════════════════════════════════════════════════
    
    const boutiqueExistante = await Boutique.findById(id).session(session);
    if (!boutiqueExistante) {
      throw new Error('Boutique non trouvée');
    }
    
    console.log(` Boutique trouvée: ${boutiqueExistante.nom}`);
    
    // ════════════════════════════════════════════════════════════
    // MISE À JOUR DES CATÉGORIES SI FOURNIES
    // ════════════════════════════════════════════════════════════
    
    if (categoryIds !== null) {
      await _validateCategories(categoryIds, session);
      boutiqueData.categories = categoryIds;
      console.log(` Catégories mises à jour: ${categoryIds.length}`);
    }
    
    // ════════════════════════════════════════════════════════════
    // MISE À JOUR DE LA BOUTIQUE
    // ════════════════════════════════════════════════════════════
    
    const boutique = await Boutique.findByIdAndUpdate(
      id,
      boutiqueData,
      { new: true, runValidators: true, session }
    );
    
    console.log(` Boutique mise à jour: ${boutique.nom}`);
    
    // ════════════════════════════════════════════════════════════
    // GESTION DES UTILISATEURS SI FOURNIS
    // ════════════════════════════════════════════════════════════
    
    let usersUpdate = { added: 0, removed: 0 };
    if (userIds !== null) {
      usersUpdate = await _updateUsersRelations(id, userIds, session);
      console.log(` Utilisateurs mis à jour: +${usersUpdate.added} -${usersUpdate.removed}`);
    }
    
    // ════════════════════════════════════════════════════════════
    // COMMIT ET RETOUR
    // ════════════════════════════════════════════════════════════
    
    await session.commitTransaction();
    session.endSession();
    
    const boutiqueComplete = await _getBoutiqueWithRelations(id);
    
    console.log('\n' + ''.repeat(30));
    console.log(' MISE À JOUR BOUTIQUE TERMINÉE AVEC SUCCÈS');
    console.log(''.repeat(30) + '\n');
    
    return {
      success: true,
      boutique: boutiqueComplete,
      statistiques: {
        usersAdded: usersUpdate.added,
        usersRemoved: usersUpdate.removed,
        categoriesUpdated: categoryIds !== null ? categoryIds.length : null,
        totalChanges: usersUpdate.added + usersUpdate.removed + (categoryIds?.length || 0)
      },
      message: `Boutique "${boutique.nom}" mise à jour avec succès`
    };
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('\n' + ''.repeat(30));
    console.error(' ÉCHEC MISE À JOUR BOUTIQUE');
    console.error(''.repeat(30));
    console.error('Erreur:', error.message);
    console.error(''.repeat(30) + '\n');
    
    throw new Error(`Impossible de mettre à jour la boutique: ${error.message}`);
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
  createBoutiqueWithRelations,
  updateBoutiqueWithRelations,
};
