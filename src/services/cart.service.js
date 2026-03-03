// ============================================
// src/services/cart.service.js
// Service Panier - Version optimisée sans duplication boutiqueId
// ============================================

const mongoose = require('mongoose');
const Produit = require('../models/Produit.js');
const Boutique = require('../models/Boutique.js');
const orderService = require('./order.service');
const { createValidationError, createNotFoundError } = require('../utils/apiError');
const {
  calculateSubtotal,
  roundTo2Decimals,
  sanitizePercentage
} = require('../utils/validationUtils');

class CartService {
  
  /**
   * Formater les items du panier pour affichage (regroupement par boutique)
   * 
   * Workflow :
   * 1. Récupérer TOUS les produits en 1 requête (avec boutiqueId)
   * 2. Regrouper items par boutiqueId DU PRODUIT (pas de l'item)
   * 3. Calculer totaux avec snapshot dynamique (prix + remises actuelles)
   * 
   * @param {Array} cartItems - Items du panier [{productId, quantity}]
   * @returns {Object} Panier formaté avec regroupement par boutique
   */
  async formatCartForPreview(cartItems) {
    if (!cartItems || cartItems.length === 0) {
      return { 
        boutiques: [], 
        summary: { totalBoutiques: 0, totalItems: 0, grandTotal: 0 } 
      };
    }
    
    // ============================================
    // 1. RÉCUPÉRER PRODUITS + BOUTIQUES EN 2 REQUÊTES
    // ============================================

    console.log(cartItems)
    
    // a. Récupérer produits avec boutiqueId
    const productIds = [...new Set(cartItems.map(item => item.productId))];
    const produits = await Produit.find({
      _id: { $in: productIds },
      actif: true,
      publierSurLeWeb: true
    })
    .select('nom prix boutiqueId enPromotion pourcentagePromo remise image reference')
    .lean();

    console.log(produits)
    
    // b. Map produitId → produit pour accès rapide
    const produitsMap = new Map();
    produits.forEach(p => produitsMap.set(p._id.toString(), p));
    
    // c. Extraire boutiqueIds uniques
    const boutiqueIds = [...new Set(produits.map(p => p.boutiqueId.toString()))];
    const boutiques = await Boutique.find({
      _id: { $in: boutiqueIds }
    })
    .select('nom')
    .lean();
    
    const boutiquesMap = new Map();
    boutiques.forEach(b => boutiquesMap.set(b._id.toString(), b.nom));
    
    // ============================================
    // 2. REGROUPER ITEMS PAR BOUTIQUE (DU PRODUIT)
    // ============================================
    
    const itemsByBoutique = {};
    
    for (const item of cartItems) {
      const produit = produitsMap.get(item.productId.toString());
      
      // Ignorer produits introuvables/inactifs
      if (!produit) continue;
      
      const boutiqueId = produit.boutiqueId.toString();
      if (!itemsByBoutique[boutiqueId]) {
        itemsByBoutique[boutiqueId] = {
          boutiqueId: produit.boutiqueId,
          boutiqueNom: boutiquesMap.get(boutiqueId) || 'Boutique inconnue',
          items: [],
          subtotal: 0,
          totalDiscount: 0
        };
      }
      
      // Déterminer remise applicable AU MOMENT DU CHECKOUT (snapshot dynamique)
      let discountPct = 0;
      if (produit.enPromotion && produit.pourcentagePromo > 0) {
        discountPct = produit.pourcentagePromo;
      } else if (produit.remise > 0) {
        discountPct = produit.remise;
      }
      
      const itemTotal = produit.prix * (item.quantity || 1);
      const itemDiscountAmount = (itemTotal * discountPct) / 100;
      const itemSubtotal = itemTotal - itemDiscountAmount;
      
      itemsByBoutique[boutiqueId].items.push({
        productId: produit._id,
        productName: produit.nom,
        productPrice: roundTo2Decimals(produit.prix),
        productImage: produit.image,
        productReference: produit.reference,
        quantity: item.quantity || 1,
        itemDiscountPercentage: discountPct,
        itemDiscountAmount: roundTo2Decimals(itemDiscountAmount),
        itemSubtotal: roundTo2Decimals(itemSubtotal),
        itemTotal: roundTo2Decimals(itemTotal)
      });
      
      itemsByBoutique[boutiqueId].subtotal += itemSubtotal;
      itemsByBoutique[boutiqueId].totalDiscount += itemDiscountAmount;
    }
    
    // ============================================
    // 3. CALCUL TOTAUX GLOBAUX
    // ============================================
    
    const boutiquesArray = Object.values(itemsByBoutique).map(boutique => ({
      ...boutique,
      subtotal: roundTo2Decimals(boutique.subtotal),
      totalDiscount: roundTo2Decimals(boutique.totalDiscount)
    }));
    
    const grandTotal = boutiquesArray.reduce((sum, b) => sum + b.subtotal, 0);
    
    return {
      boutiques: boutiquesArray,
      summary: {
        totalBoutiques: boutiquesArray.length,
        totalItems: cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
        grandTotal: roundTo2Decimals(grandTotal)
      }
    };
  }
  
  /**
   * Créer des commandes à partir des items du panier (1 par boutique)
   * 
   * Workflow :
   * 1. Récupérer produits avec boutiqueId
   * 2. Regrouper items par boutiqueId DU PRODUIT
   * 3. Pour chaque boutique : créer commande via OrderService.createOnlineOrder()
   * 
   * @param {String} userId - ID utilisateur client authentifié
   * @param {Array} cartItems - Items du panier [{productId, quantity}]
   * @param {String} shippingAddress - Adresse de livraison
   * @returns {Array} Liste des commandes créées
   */
  async createOrdersFromCartItems(userId, cartItems, shippingAddress) {
    if (!cartItems || cartItems.length === 0) {
      throw createValidationError('Panier vide', [
        { field: 'cartItems', reason: 'Ajoutez des articles avant de valider' }
      ]);
    }
    
    if (!shippingAddress?.trim()) {
      throw createValidationError('Adresse de livraison requise', [
        { field: 'shippingAddress', reason: 'L\'adresse de livraison ne peut pas être vide' }
      ]);
    }
    
    // ============================================
    // 1. RÉCUPÉRER PRODUITS AVEC BOUTIQUE_ID
    // ============================================
    
    const productIds = [...new Set(cartItems.map(item => item.productId))];
    const produits = await Produit.find({
      _id: { $in: productIds },
      actif: true,
      publierSurLeWeb: true
    })
    .select('nom prix boutiqueId quantite enPromotion pourcentagePromo remise')
    .lean();
    
    const produitsMap = new Map();
    produits.forEach(p => produitsMap.set(p._id.toString(), p));
    
    // ============================================
    // 2. VALIDER STOCK & CONSTRUIRE ITEMS PAR BOUTIQUE
    // ============================================
    
    const itemsByBoutique = {};
    
    for (const item of cartItems) {
      const produit = produitsMap.get(item.productId.toString());
      
      if (!produit) {
        throw createNotFoundError('Produit', item.productId);
      }
      
      // Vérifier stock
      const quantity = item.quantity || 1;
      if (produit.quantite < quantity) {
        throw createValidationError(
          `Stock insuffisant pour "${produit.nom}"`,
          [{ field: 'stock', reason: `Demandé: ${quantity}, Disponible: ${produit.quantite}` }]
        );
      }
      
      const boutiqueId = produit.boutiqueId.toString();
      if (!itemsByBoutique[boutiqueId]) {
        itemsByBoutique[boutiqueId] = {
          boutiqueId: produit.boutiqueId,
          items: []
        };
      }
      
      // Calculer remise article (snapshot au moment du checkout)
      let discountPct = 0;
      if (produit.enPromotion && produit.pourcentagePromo > 0) {
        discountPct = produit.pourcentagePromo;
      } else if (produit.remise > 0) {
        discountPct = produit.remise;
      }
      
      itemsByBoutique[boutiqueId].items.push({
        productId: produit._id,
        quantity,
        itemDiscountPercentage: discountPct
      });
    }
    
    // ============================================
    // 3. CRÉER COMMANDES VIA ORDER SERVICE (RÉUTILISATION)
    // ============================================
    
    const orders = [];
    
    for (const [boutiqueId, data] of Object.entries(itemsByBoutique)) {
      // Préparer données commande online
      const orderData = {
        boutiqueId,  //  Récupéré DU PRODUIT (pas de l'item)
        items: data.items,
        shippingAddress
        // globalDiscountPercentage: 0 (fixé dans createOnlineOrder)
      };
      
      // Créer commande via OrderService (cohérence garantie)
      const order = await orderService.createOnlineOrder(orderData, userId);
      orders.push(order);
    }
    
    return orders;
  }
}

module.exports = new CartService();