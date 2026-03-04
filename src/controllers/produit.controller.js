// ============================================
// src/controllers/produit.controller.js
// Contrôleur Produit - Interface HTTP minimaliste
// ============================================

const { success, error } = require("../utils/responseHandler");
const mongoose = require("mongoose");
const {
  createProduct,
  updateProduct,
  getProductsPaginated,
  getPublicProducts, 
  getBackofficeProducts, 
} = require("../services/produit.service");

const Produit = require('../models/Produit');

/**
 * POST /api/produits
 * Créer un produit (infos minimales requises)
 */
const create = async (req, res) => {
  try {
    // Validation minimale côté contrôleur
    const { nom, description, prix, quantite, categorieId } = req.body;

    if (
      !nom ||
      !description ||
      prix === undefined ||
      quantite === undefined ||
      !categorieId
    ) {
      return error(res, {
        message: "Données incomplètes",
        statusCode: 400,
        details: [
          { field: "nom", reason: "Le nom est requis" },
          { field: "description", reason: "La description est requise" },
          { field: "prix", reason: "Le prix est requis" },
          { field: "quantite", reason: "La quantité est requise" },
          { field: "categorieId", reason: "La catégorie est requise" },
        ].filter(
          (f) =>
            (f.field === "nom" && !nom) ||
            (f.field === "description" && !description) ||
            (f.field === "prix" && prix === undefined) ||
            (f.field === "quantite" && quantite === undefined) ||
            (f.field === "categorieId" && !categorieId)
        ),
      });
    }

    // Préparer données sécurisées
    const produitData = {
      nom: nom.trim(),
      description: description.trim(),
      prix: Math.round(prix * 100) / 100,
      quantite: Math.floor(quantite),
      categorieId,
      boutiqueId: req.user.boutiqueId, // 🔒 FORCÉ par sécurité
      marque: req.body.marque?.trim() || null,
      image: req.body.image || null,
      imagesSecondaires: Array.isArray(req.body.imagesSecondaires)
        ? req.body.imagesSecondaires.slice(0, 5)
        : [],
      reference: req.body.reference?.trim() || null,
      publierSurLeWeb: req.body.publierSurLeWeb ?? false,
      enPromotion: req.body.enPromotion ?? false,
      pourcentagePromo: req.body.pourcentagePromo ?? 0,
      remise: req.body.remise ?? 0,
      actif: req.body.actif ?? true,
    };

    // Appel service
    const produit = await createProduct(produitData, req.user.id);

    // Réponse succès
    return success(res, 201, `Produit "${produit.nom}" créé avec succès`, {
      produit,
    });
  } catch (err) {
    return error(res, err);
  }
};

/**
 * PUT /api/produits/:id
 * Mettre à jour un produit (tous champs)
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, {
        message: "ID de produit invalide",
        statusCode: 400,
        details: [{ field: "id", reason: "Format d'identifiant incorrect" }],
      });
    }

    // Préparer données de mise à jour
    const updateData = {
      nom: req.body.nom?.trim(),
      description: req.body.description?.trim(),
      prix:
        req.body.prix !== undefined
          ? Math.round(req.body.prix * 100) / 100
          : undefined,
      quantite:
        req.body.quantite !== undefined
          ? Math.floor(req.body.quantite)
          : undefined,
      categorieId: req.body.categorieId,
      marque: req.body.marque?.trim() || null,
      image: req.body.image || null,
      imagesSecondaires: Array.isArray(req.body.imagesSecondaires)
        ? req.body.imagesSecondaires.slice(0, 5)
        : undefined,
      reference: req.body.reference?.trim() || null,
      publierSurLeWeb: req.body.publierSurLeWeb,
      enPromotion: req.body.enPromotion,
      pourcentagePromo: req.body.pourcentagePromo,
      remise: req.body.remise,
      actif: req.body.actif,
    };

    // Supprimer les champs undefined pour ne pas écraser
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    console.log(updateData)
    // Appel service
    const produit = await updateProduct(id, updateData, req.user.id);

    // Réponse succès
    return success(
      res,
      200,
      `Produit "${produit.nom}" mis à jour avec succès`,
      { produit }
    );
  } catch (err) {
    return error(res, err);
  }
};

/**
 * GET /api/produits
 * Liste paginée de produits
 */
const list = async (req, res) => {
  try {
    // Extraire paramètres de pagination/filtres
    const {
      page = 1,
      limit = 10,
      categorieId,
      marque,
      prixMin,
      prixMax,
      enPromotion,
    } = req.query;

    const query = {
      page: parseInt(page),
      limit: parseInt(limit),
      ...(categorieId && { categorieId }),
      ...(marque && { marque: marque.toLowerCase().trim() }),
      ...(prixMin && { prix: { $gte: parseFloat(prixMin) } }),
      ...(prixMax && { prix: { $lte: parseFloat(prixMax) } }),
      ...(enPromotion !== undefined && { enPromotion: enPromotion === "true" }),
    };

    // Appel service avec contexte utilisateur
    const result = await getProductsPaginated(
      query,
      req.user?.id || null,
      req.user?.role || null
    );

    // Réponse succès
    return success(
      res,
      200,
      "Liste des produits récupérée avec succès",
      result
    );
  } catch (err) {
    return error(res, err);
  }
};




/**
 * GET /api/produits/public
 * Liste PUBLIQUE paginée (catalogue vitrine - sans authentification)
 */
const listPublic = async (req, res) => {
  try {
    const { page = 1, categorieId, marque, prixMin, prixMax, enPromotion } = req.query;
    
    const query = {
      page,
      ...(categorieId && { categorieId }),
      ...(marque && { marque: marque.toLowerCase().trim() }),
      ...(prixMin && { prix: { $gte: parseFloat(prixMin) } }),
      ...(prixMax && { prix: { $lte: parseFloat(prixMax) } }),
      ...(enPromotion !== undefined && { enPromotion: enPromotion === 'true' })
    };
    
    const result = await getPublicProducts(query);
    return success(res, 200, 'Catalogue public récupéré avec succès', result);
    
  } catch (err) {
    return error(res, err);
  }
};



/**
 * GET /api/produits
 * Liste BACKOFFICE paginée (gestion boutique - authentifié)
 */
const listBackoffice = async (req, res) => {
  try {
    const { page = 1, categorieId, marque, prixMin, prixMax, enPromotion, actif } = req.query;
    
    const query = {
      page,
      ...(categorieId && { categorieId }),
      ...(marque && { marque: marque.toLowerCase().trim() }),
      ...(prixMin && { prix: { $gte: parseFloat(prixMin) } }),
      ...(prixMax && { prix: { $lte: parseFloat(prixMax) } }),
      ...(enPromotion !== undefined && { enPromotion: enPromotion === 'true' }),
      ...(actif !== undefined && { actif: actif === 'true' }) // ✅ Filtre backoffice: statut
    };
    
    const result = await getBackofficeProducts(query, req.user.id);
    return success(res, 200, 'Catalogue backoffice récupéré avec succès', result);
    
  } catch (err) {
    return error(res, err);
  }
};


/**
 * GET /api/produits/boutique/actifs
 * Liste TOUS les produits actifs de la boutique (pour formulaires/selects)
 * Sans pagination - optimisé pour dropdown
 *
 * @route   GET /api/produits/boutique/actifs
 * @access  Private/Boutique
 */
const listActiveByBoutique = async (req, res) => {
  try {
    const User = require('../models/User');

    // Récupérer boutiqueId depuis le token
    const user = await User.findById(req.user.id)
      .select('boutiqueId')
      .lean();

    if (!user?.boutiqueId) {
      return error(res, {
        message: 'Boutique introuvable',
        statusCode: 404,
        details: [{ field: 'boutiqueId', reason: 'Aucune boutique associée à ce compte' }],
      });
    }

    

    const produits = await Produit.find({
      boutiqueId: user.boutiqueId,
      actif: true,
    })
    .select('nom prix remise enPromotion pourcentagePromo quantite reference')
    .sort({ nom: 1 }) // Alphabétique pour le select
    .lean({ virtuals: true }); //  Inclut prixFinal (virtual)

    return success(res, 200, `${produits.length} produit(s) actif(s)`, {
      produits
    });

  } catch (err) {
    return error(res, err);
  }
};






/**
 * GET /api/produits/:id
 * Récupérer un produit par ID (boutique propriétaire uniquement)
 *
 * @route   GET /api/produits/:id
 * @access  Private/Boutique
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validation ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, {
        message: 'ID de produit invalide',
        statusCode: 400,
        details: [{ field: 'id', reason: 'Format d\'identifiant incorrect' }],
      });
    }

    // Récupérer boutiqueId depuis le token
    const User = require('../models/User');
    const user = await User.findById(req.user.id)
      .select('boutiqueId role')
      .lean();

    if (!user?.boutiqueId) {
      return error(res, {
        message: 'Boutique introuvable',
        statusCode: 404,
        details: [{ field: 'boutiqueId', reason: 'Aucune boutique associée à ce compte' }],
      });
    }

    // Récupérer le produit
    const produit = await Produit.findById(id)
      .populate('categorieId', 'nom description')
      .populate('boutiqueId', 'nom email')
      .lean();

    if (!produit) {
      return error(res, {
        message: 'Produit introuvable',
        statusCode: 404,
        details: [{ field: 'id', reason: `Aucun produit avec l'ID ${id}` }],
      });
    }

    // Sécurité : vérifier que le produit appartient à la boutique
    if (produit.boutiqueId._id.toString() !== user.boutiqueId.toString()) {
      return error(res, {
        message: 'Accès refusé',
        statusCode: 403,
        details: [{ field: 'boutiqueId', reason: 'Ce produit n\'appartient pas à votre boutique' }],
      });
    }

    return success(res, 200, `Produit "${produit.nom}" récupéré avec succès`, {
      produit
    });

  } catch (err) {
    return error(res, err);
  }
};




module.exports = {
  create,
  update,
  list,
  listPublic, 
  listBackoffice,
  listActiveByBoutique ,
  getById
}
