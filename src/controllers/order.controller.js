// ============================================
// src/controllers/order.controller.js
// Contrôleur Commande - Interface HTTP minimaliste
// ============================================

const { success, error } = require("../utils/responseHandler");
const orderService = require("../services/order.service");

/**
 * POST /api/orders
 * Créer une vente physique (back-office boutique)
 *
 * @route POST /api/orders
 * @access Private/Boutique
 * @body {Array} items - Lignes de commande [{productId, quantity, itemDiscountPercentage?}]
 * @body {String} paymentMethod - Méthode de paiement ('cash' | 'card' | 'transfer')
 * @body {Number} [globalDiscountPercentage] - Remise globale en % (défaut: 0)
 * @body {String} [nomClient] - Nom du client pour facturation (optionnel)
 * @returns {JSON} 201: Commande créée | 400: Validation | 403: Accès refusé
 */
const createOrder = async (req, res) => {
  try {
    // ============================================
    // VALIDATION MINIMALE CÔTÉ CONTRÔLEUR
    // ============================================

    const { items, paymentMethod, globalDiscountPercentage, nomClient } =
      req.body;

    // Validation items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return error(res, {
        message: "Données invalides",
        statusCode: 400,
        details: [
          { field: "items", reason: "La liste des articles est requise" },
        ],
      });
    }

    // Validation paymentMethod
    if (
      !paymentMethod ||
      !["cash", "card", "transfer"].includes(paymentMethod)
    ) {
      return error(res, {
        message: "Méthode de paiement invalide",
        statusCode: 400,
        details: [
          {
            field: "paymentMethod",
            reason: "Valeurs autorisées: cash, card, transfer",
          },
        ],
      });
    }

    // ============================================
    // PRÉPARATION DONNÉES SÉCURISÉES
    // ============================================

    const orderData = {
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity || 1,
        itemDiscountPercentage: item.itemDiscountPercentage || 0,
      })),
      paymentMethod,
      globalDiscountPercentage: parseFloat(globalDiscountPercentage) || 0,
      nomClient: nomClient?.trim() || null,
    };

    // ============================================
    // APPEL SERVICE
    // ============================================

    const order = await orderService.createInStoreOrder(orderData, req.user.id);

    // ============================================
    // RÉPONSE SUCCÈS AVEC RÉSUMÉ
    // ============================================

    return success(res, 201, `Vente #${order.reference} créée avec succès`, {
      order,
      summary: {
        items: order.items.length,
        totalItems: order.items.reduce((sum, i) => sum + i.quantity, 0),
        subtotal: order.subtotal,
        totalDiscount: order.totalDiscount,
        globalDiscountPercentage: order.globalDiscountPercentage,
        globalDiscountAmount: order.globalDiscountAmount,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        seller: order.sellerId?.nom || "N/A",
        boutique: order.boutiqueId?.nom || "N/A",
      },
    });
  } catch (err) {
    // Formatage uniforme via le module d'erreurs
    return error(res, err);
  }
};


/**
 * GET /api/orders/boutique
 * Lister les commandes de la boutique authentifiée
 *
 * @route   GET /api/orders/boutique
 * @access  Private/Boutique
 * @query   {String}  [status] - Filtrer par statut (draft|pending|paid|completed|cancelled)
 * @query   {String}  [type]   - Filtrer par type (in_store|online)
 * @query   {Number}  [page]   - Page (défaut: 1)
 * @query   {Number}  [limit]  - Limite par page (défaut: 10)
 */
const getOrdersByBoutique = async (req, res) => {
  try {
    // ============================================
    // 1. RÉCUPÉRATION BOUTIQUE DEPUIS LE TOKEN
    // ============================================
    const user = await require('../models/User')
      .findById(req.user.id)
      .select('boutiqueId role')
      .lean();

    if (!user?.boutiqueId) {
      return error(res, {
        message: 'Boutique introuvable',
        statusCode: 404,
        details: [{ field: 'boutiqueId', reason: 'Aucune boutique associée à ce compte' }],
      });
    }

    // ============================================
    // 2. VALIDATION QUERY PARAMS
    // ============================================
    const validStatuses = ['draft', 'pending', 'paid', 'completed', 'cancelled'];
    const validTypes    = ['in_store', 'online'];

    const { status, type, page = 1, limit = 10 } = req.query;

    if (status && !validStatuses.includes(status)) {
      return error(res, {
        message: 'Statut invalide',
        statusCode: 400,
        details: [{ field: 'status', reason: `Valeurs autorisées: ${validStatuses.join(', ')}` }],
      });
    }

    if (type && !validTypes.includes(type)) {
      return error(res, {
        message: 'Type invalide',
        statusCode: 400,
        details: [{ field: 'type', reason: `Valeurs autorisées: ${validTypes.join(', ')}` }],
      });
    }

    const parsedPage  = Math.max(1, parseInt(page)  || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit) || 10)); // Max 50

    // ============================================
    // 3. APPEL SERVICE
    // ============================================
    const result = await orderService.getOrdersByBoutique(
      user.boutiqueId,
      { status, type, page: parsedPage, limit: parsedLimit }
    );

    // ============================================
    // 4. RÉPONSE
    // ============================================
    return success(res, 200, `${result.totalDocuments} commande(s) trouvée(s)`, result);

  } catch (err) {
    return error(res, err);
  }
};

// ============================================
// EXPORT — ajoute getOrdersByBoutique
// ============================================
module.exports = {
  createOrder,
  getOrdersByBoutique,
};
