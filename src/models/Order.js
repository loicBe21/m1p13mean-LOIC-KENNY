// ============================================
// src/models/order.model.js
// Modèle Commande - Version complète avec remise globale en %
// ============================================

const mongoose = require("mongoose");

/**
 * Schéma Commande
 *
 * Représente une commande/vente avec :
 * - Contexte (in_store = vente physique, online = commande client)
 * - Snapshot complet des produits au moment de la vente
 * - Remises article (pourcentage + montant)
 * - Remise globale (pourcentage + montant)
 * - Totaux calculés et stockés pour historique
 *
 * @property {String} type - Type de commande ('in_store' | 'online')
 * @property {ObjectId} boutiqueId - Boutique concernée
 * @property {ObjectId} sellerId - Vendeur (obligatoire pour in_store)
 * @property {ObjectId} clientId - Client (optionnel pour online)
 * @property {String} nomClient - Nom du client (optionnel, pour facturation)
 * @property {String} status - Statut de la commande
 * @property {Date} orderDate - Date de création
 * @property {Array} items - Lignes de commande avec snapshot produits
 * @property {Number} subtotal - Sous-total avant remises globales
 * @property {Number} globalDiscountPercentage - Remise globale (%)
 * @property {Number} globalDiscountAmount - Montant remise globale
 * @property {Number} totalDiscount - Total remises (articles + globale)
 * @property {Number} grandTotal - Total final à payer
 * @property {String} paymentMethod - Méthode de paiement
 * @property {String} paymentStatus - Statut paiement
 * @property {Date} paymentDate - Date paiement
 * @property {String} reference - Référence unique auto-générée
 */
const orderSchema = new mongoose.Schema(
  {
    // ============================================
    // CONTEXTE & RELATIONS
    // ============================================

    type: {
      type: String,
      enum: ["in_store", "online"],
      default: "in_store",
      required: true,
      index: true,
      description:
        "Type de commande: in_store (vente physique) ou online (commande client)",
    },

    boutiqueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Boutique",
      required: true,
      index: true,
      description: "Boutique concernée par la commande",
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.type === "in_store";
      },
      description:
        "Vendeur ayant créé la commande (obligatoire pour vente physique)",
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      description: "Client ayant passé la commande (optionnel pour online)",
    },

    // ============================================
    // INFORMATIONS CLIENT
    // ============================================

    nomClient: {
      type: String,
      trim: true,
      maxlength: [100, "Le nom du client ne peut pas dépasser 100 caractères"],
      description: "Nom du client pour facturation (optionnel)",
    },

    // ============================================
    // ÉTAT & MÉTADONNÉES
    // ============================================

    status: {
      type: String,
      enum: ["draft", "pending", "paid", "completed", "cancelled"],
      default: "completed",
      description: "Statut de la commande",
    },

    orderDate: {
      type: Date,
      default: Date.now,
      description: "Date de création de la commande",
    },

    // ============================================
    // LIGNES DE COMMANDE (SNAPSHOT PRODUITS)
    // ============================================

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Produit",
          required: true,
        },
        productName: {
          type: String,
          required: true,
          description: "Nom du produit au moment de la vente (snapshot)",
        },
        productPrice: {
          type: Number,
          required: true,
          description: "Prix unitaire au moment de la vente (snapshot)",
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          description: "Quantité commandée",
        },

        // Remise article (pourcentage + montant)
        itemDiscountPercentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
          description: "Pourcentage de remise sur cet article",
        },
        itemDiscountAmount: {
          type: Number,
          default: 0,
          min: 0,
          description: "Montant de la remise sur cet article (calculé)",
        },

        // Sous-total article après remise
        itemSubtotal: {
          type: Number,
          required: true,
          description: "Sous-total article: (prix × quantité) - remise",
        },
      },
    ],

    // ============================================
    // CALCULS FINANCIERS (STOCKÉS POUR HISTORIQUE)
    // ============================================

    subtotal: {
      type: Number,
      required: true,
      description: "Sous-total: somme des itemSubtotal (avant remise globale)",
    },

    globalDiscountPercentage: {
      type: Number,
      default: 0,
      min: [0, "La remise globale ne peut pas être négative"],
      max: [100, "La remise globale ne peut pas dépasser 100%"],
      description: "Pourcentage de remise globale appliqué sur le sous-total",
    },

    globalDiscountAmount: {
      type: Number,
      default: 0,
      min: 0,
      description: "Montant calculé de la remise globale (pour historique)",
    },

    totalDiscount: {
      type: Number,
      required: true,
      default: 0,
      description: "Total remises: somme remises articles + remise globale",
    },

    grandTotal: {
      type: Number,
      required: true,
      description: "Grand total final: subtotal - totalDiscount",
    },

    // ============================================
    // PAIEMENT
    // ============================================

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "transfer" , "online"],
      required: true,
      description: "Méthode de paiement utilisée",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "paid",
      description: "Statut du paiement",
    },

    paymentDate: {
      type: Date,
      default: Date.now,
      description: "Date du paiement",
    },

    // ============================================
    // RÉFÉRENCE UNIQUE
    // ============================================

    reference: {
      type: String,
      unique: true,
      description: "Référence unique auto-générée (ex: CMD-2026-00001)",
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES OPTIMISÉS
// ============================================

orderSchema.index({ boutiqueId: 1, orderDate: -1 });
orderSchema.index({ sellerId: 1, orderDate: -1 });
orderSchema.index({ clientId: 1, orderDate: -1 });
orderSchema.index({ reference: 1 });
orderSchema.index({ nomClient: 1, orderDate: -1 }); // Pour recherche par client

// ============================================
// HOOK : GÉNÉRATION RÉFÉRENCE AUTO
// ============================================

/**
 * Hook pré-save : Génère une référence unique si non fournie
 * Format: CMD-{année}-{numéro séquentiel sur 5 chiffres}
 */
orderSchema.pre("save", async function (next) {
  if (this.isNew && !this.reference) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.reference = `CMD-${year}-${String(count + 1).padStart(5, "0")}`;
  }
  next;
});

// ============================================
// MÉTHODES STATIQUES
// ============================================

/**
 * Calculer les totaux d'une commande
 * @param {Array} items - Tableau des lignes de commande
 * @returns {Object} { subtotal, totalDiscount, grandTotal }
 */
orderSchema.statics.calculateTotals = function (items) {
  const subtotal = items.reduce((sum, item) => sum + item.itemSubtotal, 0);
  const totalDiscount = items.reduce(
    (sum, item) => sum + item.itemDiscountAmount,
    0
  );
  const grandTotal = subtotal - totalDiscount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
};

// ============================================
// EXPORT
// ============================================

module.exports = mongoose.model("Order", orderSchema);
