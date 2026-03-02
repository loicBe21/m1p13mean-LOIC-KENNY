// ============================================
// src/services/produit.service.js
// Service Produit - Workflow boutique simplifié
// ============================================

const mongoose = require("mongoose");
const Produit = require("../models/Produit.js");
const User = require("../models/User.js");
const {
  ApiError,
  createValidationError,
  createForbiddenError,
  createNotFoundError,
  createDuplicateError,
} = require("../utils/apiError");
const paginateAndFilter = require("../utils/paginate");

// ============================================
// MÉTHODES MÉTIER
// ============================================

/**
 * Créer un produit pour une boutique
 * @param {Object} data - Données du produit (validées par contrôleur)
 * @param {String} userId - ID utilisateur boutique authentifié
 * @returns {Object} Produit créé
 */
const createProduct = async (data, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Vérifier utilisateur boutique actif
    const user = await User.findById(userId)
      .select("role boutiqueId actif")
      .session(session);

    if (!user || user.role !== "boutique" || !user.actif) {
      throw createForbiddenError(
        "Seul un utilisateur boutique actif peut créer des produits"
      );
    }

    // 2. Vérifier cohérence boutique (sécurité)
    if (data.boutiqueId.toString() !== user.boutiqueId.toString()) {
      throw createForbiddenError(
        "Vous ne pouvez créer des produits que pour votre propre boutique"
      );
    }

    // 3. Créer le produit
    let produit;
    try {
      [produit] = await Produit.create([data], { session });
    } catch (err) {
      if (err.code === 11000 && err.keyPattern?.reference) {
        throw createDuplicateError("reference", data.reference);
      }
      throw err; // Relancer pour middleware global
    }

    await session.commitTransaction();
    session.endSession();

    // 4. Retourner produit enrichi
    return await Produit.findById(produit._id)
      .populate("categorieId", "nom")
      .populate("boutiqueId", "nom")
      .lean();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error; // Relancer pour formatage par middleware
  }
};

/**
 * Mettre à jour un produit (tous champs)
 * @param {String} id - ID du produit
 * @param {Object} data - Nouvelles données (tous champs)
 * @param {String} userId - ID utilisateur boutique authentifié
 * @returns {Object} Produit mis à jour
 */
const updateProduct = async (id, data, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Vérifier utilisateur boutique actif
    const user = await User.findById(userId)
      .select("role boutiqueId actif")
      .session(session);

    if (!user || user.role !== "boutique" || !user.actif) {
      throw createForbiddenError(
        "Seul un utilisateur boutique actif peut modifier des produits"
      );
    }

    // 2. Trouver le produit
    const produit = await Produit.findById(id).session(session);
    if (!produit) {
      throw createNotFoundError("Produit", id);
    }

    // 3. Vérifier ownership (sécurité critique)
    if (produit.boutiqueId.toString() !== user.boutiqueId.toString()) {
      throw createForbiddenError(
        "Vous ne pouvez modifier que les produits de votre propre boutique"
      );
    }

    // 4. Empêcher modification de boutiqueId (sécurité)
    if (
      data.boutiqueId &&
      data.boutiqueId.toString() !== produit.boutiqueId.toString()
    ) {
      throw createForbiddenError(
        "Impossible de modifier la boutique d'un produit existant"
      );
    }

    // 5. Mettre à jour (sans modifier _id, createdAt)
    const updateData = { ...data };
    delete updateData._id;
    delete updateData.createdAt;

    await Produit.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    // 6. Retourner produit mis à jour
    return await Produit.findById(id)
      .populate("categorieId", "nom")
      .populate("boutiqueId", "nom")
      .lean();
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * Obtenir liste paginée de produits
 * @param {Object} query - Paramètres de requête (page, limit, filtres)
 * @param {String} userId - ID utilisateur authentifié (optionnel)
 * @param {String} role - Rôle utilisateur (optionnel)
 * @returns {Object} Résultat paginé
 */
const getProductsPaginated = async (query = {}, userId = null, role = null) => {
  // Filtres de base selon contexte
  const baseFilters = {};

  // Utilisateur boutique : uniquement ses produits
  if (role === "boutique" && userId) {
    const user = await User.findById(userId).select("boutiqueId");
    if (user && user.boutiqueId) {
      baseFilters.boutiqueId = user.boutiqueId;
    }
  }
  // Public ou client : uniquement produits publiés et actifs
  else {
    baseFilters.publierSurLeWeb = true;
    baseFilters.actif = true;
  }

  // Appliquer filtres utilisateur + base
  const filters = { ...baseFilters, ...query };

  // Pagination
  return await paginateAndFilter(Produit, filters, {}, [
    { path: "categorieId", select: "nom" },
    { path: "boutiqueId", select: "nom" },
  ]);
};



/**
 * Obtenir liste PUBLIQUE paginée (catalogue vitrine)
 * @param {Object} query - Filtres (page, categorieId, marque, etc.)
 * @returns {Object} Résultat paginé (uniquement produits publiés + actifs)
 */
const getPublicProducts = async (query = {}) => {
  // Filtres publics stricts
  const publicFilters = {
    publierSurLeWeb: true,
    actif: true
  };
  
  return await paginateAndFilter(
    Produit,
    { ...query, ...publicFilters },
    {},
    [
      { path: 'categorieId', select: 'nom' },
      { path: 'boutiqueId', select: 'nom' }
    ],
    'public' // ✅ Contexte public → utilise PAGINATION_LIMIT_PUBLIC
  );
};


/**
 * Obtenir liste BACKOFFICE paginée (gestion boutique)
 * @param {Object} query - Filtres (page, categorieId, actif, etc.)
 * @param {String} userId - ID utilisateur boutique authentifié
 * @returns {Object} Résultat paginé (tous les produits de la boutique)
 */
const getBackofficeProducts = async (query = {}, userId) => {
  // Vérifier utilisateur boutique
  const user = await User.findById(userId).select('role boutiqueId');
  if (!user || user.role !== 'boutique' || !user.boutiqueId) {
    throw createForbiddenError('Accès backoffice réservé aux utilisateurs boutique');
  }
  
  // Filtres backoffice : uniquement produits de la boutique (tous statuts)
  const backofficeFilters = {
    boutiqueId: user.boutiqueId
  };
  
  return await paginateAndFilter(
    Produit,
    { ...query, ...backofficeFilters },
    {},
    [
      { path: 'categorieId', select: 'nom description' },
      { path: 'boutiqueId', select: 'nom email' }
    ],
    'backoffice' // ✅ Contexte backoffice → utilise PAGINATION_LIMIT_BACKOFFICE
  );
};







// ============================================
// EXPORTS
// ============================================

module.exports = {
  createProduct,
  updateProduct,
  getProductsPaginated,
  getPublicProducts, 
  getBackofficeProducts
};
