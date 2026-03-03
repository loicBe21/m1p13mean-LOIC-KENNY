// ============================================
// src/services/order.service.js
// Service Commande - Version finale avec utilitaires de validation
// ============================================

const mongoose = require("mongoose");
const Order = require("../models/Order.js");
const Produit = require("../models/Produit.js");
const User = require("../models/User.js");
const {
  createValidationError,
  createForbiddenError,
  createNotFoundError,
} = require("../utils/apiError");
const {
  validatePercentage,
  sanitizePercentage,
  validateMonetaryValue,
  sanitizeMonetaryValue,
  calculateDiscountAmount,
  calculateSubtotal,
  roundTo2Decimals,
} = require("../utils/validationUtils");

/**
 * Service de gestion des commandes
 * @class OrderService
 */
class OrderService {
  /**
   * Créer une commande de vente physique (back-office)
   * @param {Object} orderData - Données de la commande
   * @param {String} userId - ID utilisateur boutique authentifié
   * @returns {Promise<Object>} Commande créée
   */
  async createInStoreOrder(orderData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // ============================================
      // 1. VÉRIFICATION UTILISATEUR
      // ============================================
      const user = await User.findById(userId)
        .select("role boutiqueId actif nom")
        .session(session);

      if (!user) throw createNotFoundError("Utilisateur", userId);
      if (user.role !== "boutique" || !user.actif) {
        throw createForbiddenError(
          "Seul un utilisateur boutique actif peut créer des ventes"
        );
      }

      // ============================================
      // 2. VALIDATION STRICTE DES DONNÉES
      // ============================================
      this._validateOrderData(orderData);

      // ============================================
      // 3. CONSTRUCTION ITEMS AVEC UTILITAIRES
      // ============================================
      const orderItems = [];

      for (const item of orderData.items) {
        // Récupération et vérifications produit
        const produit = await Produit.findById(item.productId)
          .session(session)
          .select("nom prix boutiqueId quantite");

        if (!produit) throw createNotFoundError("Produit", item.productId);
        if (produit.boutiqueId.toString() !== user.boutiqueId.toString()) {
          throw createForbiddenError(
            `Le produit "${produit.nom}" n'appartient pas à votre boutique`
          );
        }

        const quantity = item.quantity || 1;
        if (produit.quantite < quantity) {
          throw createValidationError(
            `Stock insuffisant pour "${produit.nom}"`,
            [
              {
                field: "quantity",
                reason: `Demandé: ${quantity}, Disponible: ${produit.quantite}`,
              },
            ]
          );
        }

        // ✅ UTILISATION DES UTILITAIRES POUR LES CALCULS
        const itemDiscountPct = sanitizePercentage(
          item.itemDiscountPercentage,
          `article ${produit.nom}`
        );

        const itemTotal = produit.prix * quantity;
        const itemDiscountAmount = calculateDiscountAmount(
          itemTotal,
          itemDiscountPct,
          `item.${produit._id}`
        );

        const itemSubtotal = calculateSubtotal(
          itemTotal,
          itemDiscountAmount,
          `item.${produit._id}`
        );

        // Protection: sous-total ne peut pas être négatif
        if (itemSubtotal < 0) {
          throw createValidationError(`Calcul invalide pour "${produit.nom}"`, [
            {
              field: "itemDiscountPercentage",
              reason: `La remise de ${itemDiscountPct}% dépasse le prix total (${roundTo2Decimals(
                itemTotal
              )}€)`,
            },
          ]);
        }

        orderItems.push({
          productId: produit._id,
          productName: produit.nom,
          productPrice: roundTo2Decimals(produit.prix),
          quantity,
          itemDiscountPercentage: itemDiscountPct,
          itemDiscountAmount,
          itemSubtotal,
        });
      }

      // ============================================
      // 4. CALCUL TOTAUX AVEC UTILITAIRES
      // ============================================
      const { subtotal, totalDiscount: itemTotalDiscount } =
        Order.calculateTotals(orderItems);

      // ✅ UTILISATION DE L'UTILITAIRE POUR LA REMISE GLOBALE
      const globalDiscountPercentage = sanitizePercentage(
        orderData.globalDiscountPercentage,
        "remise globale"
      );

      const globalDiscountAmount = calculateDiscountAmount(
        subtotal,
        globalDiscountPercentage,
        "global"
      );

      // Protection: remise globale ne peut pas dépasser sous-total
      const safeGlobalDiscount = Math.min(globalDiscountAmount, subtotal);

      const totalDiscount = roundTo2Decimals(
        itemTotalDiscount + safeGlobalDiscount
      );
      let grandTotal = calculateSubtotal(subtotal, totalDiscount, "final");

      // Protection finale
      if (grandTotal < 0) {
        throw createValidationError("Calcul invalide du total", [
          {
            field: "globalDiscountPercentage",
            reason: `La remise globale dépasse le sous-total (${subtotal}€)`,
          },
        ]);
      }

      // ============================================
      // 5. CRÉATION & RETOUR
      // ============================================
      const [order] = await Order.create(
        [
          {
            type: "in_store",
            boutiqueId: user.boutiqueId,
            sellerId: userId,
            nomClient: orderData.nomClient?.trim() || null,
            status: "completed",
            items: orderItems,
            subtotal: roundTo2Decimals(subtotal),
            globalDiscountPercentage,
            globalDiscountAmount: roundTo2Decimals(safeGlobalDiscount),
            totalDiscount,
            grandTotal,
            paymentMethod: orderData.paymentMethod,
            paymentStatus: "paid",
            paymentDate: new Date(),
            reference: null,
          },
        ],
        { session }
      );

      // Décrémentation stock
      for (const item of orderData.items) {
        await Produit.findByIdAndUpdate(
          item.productId,
          { $inc: { quantite: -(item.quantity || 1) } },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      return await Order.findById(order._id)
        .populate("boutiqueId", "nom")
        .populate("sellerId", "nom email")
        .lean();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      // Transformation erreurs Mongoose
      if (error.name === "ValidationError") {
        const details = Object.values(error.errors).map((err) => ({
          field: err.path,
          reason: err.message
            .replace(/Path `[^`]+` /, "")
            .replace(/\.$/, "")
            .trim(),
        }));
        throw createValidationError("Données invalides", details);
      }

      throw error;
    }
  }

  // ============================================
  // VALIDATION MÉTIER AVEC UTILITAIRES
  // ============================================

  _validateOrderData(orderData) {
    // Validation items
    if (
      !orderData.items ||
      !Array.isArray(orderData.items) ||
      orderData.items.length === 0
    ) {
      throw createValidationError("Articles requis", [
        {
          field: "items",
          reason: "La commande doit contenir au moins un article",
        },
      ]);
    }

    // Validation paymentMethod
    const validMethods = ["cash", "card", "transfer"];
    if (
      !orderData.paymentMethod ||
      !validMethods.includes(orderData.paymentMethod)
    ) {
      throw createValidationError("Méthode de paiement invalide", [
        {
          field: "paymentMethod",
          reason: `Valeurs autorisées: ${validMethods.join(", ")}`,
        },
      ]);
    }

    // ✅ UTILISATION DE validatePercentage POUR LA REMISE GLOBALE
    if (
      orderData.globalDiscountPercentage !== undefined &&
      orderData.globalDiscountPercentage !== null
    ) {
      validatePercentage(
        orderData.globalDiscountPercentage,
        "globalDiscountPercentage",
        "remise globale"
      );
    }

    // Validation de chaque item
    orderData.items.forEach((item, index) => {
      const itemContext = `article ${index + 1}`;

      if (!item.productId) {
        throw createValidationError(`${itemContext}: Produit requis`, [
          {
            field: `items[${index}].productId`,
            reason: "ID du produit obligatoire",
          },
        ]);
      }

      if (
        !item.quantity ||
        item.quantity < 1 ||
        !Number.isInteger(item.quantity)
      ) {
        throw createValidationError(`${itemContext}: Quantité invalide`, [
          {
            field: `items[${index}].quantity`,
            reason: "Doit être un entier ≥ 1",
          },
        ]);
      }

      //  UTILISATION DE validatePercentage POUR LA REMISE ARTICLE
      if (
        item.itemDiscountPercentage !== undefined &&
        item.itemDiscountPercentage !== null
      ) {
        validatePercentage(
          item.itemDiscountPercentage,
          `items[${index}].itemDiscountPercentage`,
          itemContext
        );
      }
    });
  }



    /**
   * Créer une commande client (online) à partir d'items de panier
   * 
   * RÉUTILISE 95% DE createInStoreOrder() avec adaptations ONLINE :
   * - type: 'online' au lieu de 'in_store'
   * - clientId au lieu de sellerId
   * - shippingAddress obligatoire
   * - status: 'pending' (pas 'completed')
   * - globalDiscountPercentage: 0 (fixe - pas de remise globale online)
   * - paymentMethod: 'online' (nouvelle valeur)
   * - paymentStatus: 'pending'
   * 
   * @param {Object} orderData - Données de la commande online
   * @param {String} userId - ID utilisateur client authentifié
   * @returns {Promise<Object>} Commande créée
   */
  async createOnlineOrder(orderData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // ============================================
      // 1. VÉRIFICATION UTILISATEUR CLIENT
      // ============================================
      const user = await User.findById(userId)
        .select('role actif nom email')
        .session(session);
      
      if (!user) throw createNotFoundError('Utilisateur', userId);
      if (user.role !== 'client' || !user.actif) {
        throw createForbiddenError(
          'Seul un client actif peut passer des commandes'
        );
      }
      
      // ============================================
      // 2. VALIDATION DONNÉES ONLINE (adaptée)
      // ============================================
      this._validateOnlineOrderData(orderData);
      
      // ============================================
      // 3. CONSTRUCTION ITEMS (RÉUTILISATION TOTALE)
      // ============================================
      // ✅ MÊME LOGIQUE QUE createInStoreOrder()
      const orderItems = await this._buildOrderItems(orderData.items, userId, session);
      
      // ============================================
      // 4. CALCUL TOTAUX (RÉUTILISATION TOTALE)
      // ============================================
      // ✅ MÊME LOGIQUE QUE createInStoreOrder() mais avec remise globale = 0
      const { subtotal, totalDiscount: itemTotalDiscount } = Order.calculateTotals(orderItems);
      
      // REMISE GLOBALE FIXE À 0 POUR ONLINE (requirement métier)
      const globalDiscountPercentage = 0;
      const globalDiscountAmount = 0;
      const totalDiscount = roundTo2Decimals(itemTotalDiscount);
      const grandTotal = calculateSubtotal(subtotal, totalDiscount, 'online.final');
      
      // ============================================
      // 5. CRÉATION COMMANDE ONLINE
      // ============================================
      const [order] = await Order.create([{
        type: 'online',  // ✅ DIFFÉRENCE 1 : type online
        boutiqueId: orderData.boutiqueId, // ✅ DIFFÉRENCE 2 : boutiqueId fourni
        clientId: userId, // ✅ DIFFÉRENCE 3 : clientId au lieu de sellerId
        nomClient: user.nom,
        status: 'pending', // ✅ DIFFÉRENCE 4 : status pending
        items: orderItems,
        subtotal: roundTo2Decimals(subtotal),
        globalDiscountPercentage,
        globalDiscountAmount,
        totalDiscount,
        grandTotal,
        shippingAddress: {
          street: orderData.shippingAddress?.trim() || 'Adresse non spécifiée',
          city: '',
          postalCode: '',
          country: 'France'
        },
        paymentMethod: 'online', // ✅ DIFFÉRENCE 5 : paymentMethod online
        paymentStatus: 'pending', // ✅ DIFFÉRENCE 6 : paymentStatus pending
        paymentDate: null,
        reference: null
      }], { session });
      
      // ============================================
      // 6. DÉCRÉMENTATION STOCK (RÉUTILISATION TOTALE)
      // ============================================
      // ✅ MÊME LOGIQUE QUE createInStoreOrder()
      for (const item of orderData.items) {
        await Produit.findByIdAndUpdate(
          item.productId,
          { $inc: { quantite: -(item.quantity || 1) } },
          { session }
        );
      }
      
      await session.commitTransaction();
      session.endSession();
      
      return await Order.findById(order._id)
        .populate('boutiqueId', 'nom')
        .lean();
      
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }


  
  /**
   * Construire les items de commande avec snapshot (RÉUTILISABLE)
   * @private
   */
  async _buildOrderItems(items, userId, session) {
    const orderItems = [];
    
    for (const item of items) {
      // Récupération produit
      const produit = await Produit.findById(item.productId)
        .session(session)
        .select('nom prix boutiqueId quantite');
      
      if (!produit) throw createNotFoundError('Produit', item.productId);
      
      // Vérification stock
      const quantity = item.quantity || 1;
      if (produit.quantite < quantity) {
        throw createValidationError(`Stock insuffisant pour "${produit.nom}"`, [
          { field: 'quantity', reason: `Demandé: ${quantity}, Disponible: ${produit.quantite}` }
        ]);
      }
      
      // Calculs avec utilitaires
      const itemDiscountPct = sanitizePercentage(
        item.itemDiscountPercentage,
        `article ${produit.nom}`
      );
      
      const itemTotal = produit.prix * quantity;
      const itemDiscountAmount = calculateDiscountAmount(
        itemTotal,
        itemDiscountPct,
        `item.${produit._id}`
      );
      
      const itemSubtotal = calculateSubtotal(
        itemTotal,
        itemDiscountAmount,
        `item.${produit._id}`
      );
      
      if (itemSubtotal < 0) {
        throw createValidationError(`Calcul invalide pour "${produit.nom}"`, [
          { 
            field: 'itemDiscountPercentage',
            reason: `La remise de ${itemDiscountPct}% dépasse le prix total (${roundTo2Decimals(itemTotal)}€)`
          }
        ]);
      }
      
      orderItems.push({
        productId: produit._id,
        productName: produit.nom,
        productPrice: roundTo2Decimals(produit.prix),
        quantity,
        itemDiscountPercentage: itemDiscountPct,
        itemDiscountAmount,
        itemSubtotal
      });
    }
    
    return orderItems;
  }
  
  /**
   * Valider données commande online (adaptée)
   * @private
   */
  _validateOnlineOrderData(orderData) {
    // Validation items (identique à in_store)
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw createValidationError('Articles requis', [
        { field: 'items', reason: 'La commande doit contenir au moins un article' }
      ]);
    }
    
    // Validation boutiqueId (obligatoire pour online)
    if (!orderData.boutiqueId) {
      throw createValidationError('Boutique requise', [
        { field: 'boutiqueId', reason: 'ID de la boutique obligatoire' }
      ]);
    }
    
    // Validation shippingAddress
    if (!orderData.shippingAddress?.trim()) {
      throw createValidationError('Adresse de livraison requise', [
        { field: 'shippingAddress', reason: 'L\'adresse de livraison ne peut pas être vide' }
      ]);
    }
    
    // Validation items (identique à in_store)
    orderData.items.forEach((item, index) => {
      const itemContext = `article ${index + 1}`;
      
      if (!item.productId) {
        throw createValidationError(`${itemContext}: Produit requis`, [
          { field: `items[${index}].productId`, reason: 'ID du produit obligatoire' }
        ]);
      }
      
      if (!item.quantity || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        throw createValidationError(`${itemContext}: Quantité invalide`, [
          { field: `items[${index}].quantity`, reason: 'Doit être un entier ≥ 1' }
        ]);
      }
      
      // Validation remise article (identique)
      if (item.itemDiscountPercentage !== undefined && item.itemDiscountPercentage !== null) {
        validatePercentage(
          item.itemDiscountPercentage,
          `items[${index}].itemDiscountPercentage`,
          itemContext
        );
      }
    });
  }










}

module.exports = new OrderService();
