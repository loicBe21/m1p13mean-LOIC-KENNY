// ============================================
// src/models/produit.js
// Schéma Produit - Version finale optimisée
// ============================================

const mongoose = require("mongoose");
const { imageSimple } = require("../validators");

const produitSchema = new mongoose.Schema(
  {
    // ============================================
    // IDENTIFICATION & DESCRIPTION (OBLIGATOIRES)
    // ============================================

    nom: {
      type: String,
      required: [true, "Le nom du produit est requis (2 à 150 caractères)"],
      trim: true,
      minlength: [2, "Le nom doit contenir au moins 2 caractères"],
      maxlength: [150, "Le nom ne peut pas dépasser 150 caractères"],
    },

    description: {
      type: String,
      required: [true, "La description est requise (10 à 1000 caractères)"],
      trim: true,
      minlength: [10, "La description doit contenir au moins 10 caractères"],
      maxlength: [1000, "La description ne peut pas dépasser 1000 caractères"],
    },

    // ============================================
    // MARQUE & RÉFÉRENCE (OPTIONNELS)
    // ============================================

    marque: {
      type: String,
      trim: true,
      lowercase: true, // ✅ Uniformisation automatique
      maxlength: [100, "La marque ne peut pas dépasser 100 caractères"],
      default: null,
    },

    reference: {
      type: String,
      unique: true,
      sparse: true, // Autorise plusieurs null
      trim: true,
      maxlength: [50, "La référence ne peut pas dépasser 50 caractères"],
      default: null,
    },

    // ============================================
    // PRIX & STOCK (OBLIGATOIRES)
    // ============================================

    prix: {
      type: Number,
      required: [true, "Le prix est requis et doit être positif"],
      min: [0, "Le prix doit être positif ou nul"],
      set: (v) => Math.round(v * 100) / 100, // Arrondi 2 décimales
    },

    quantite: {
      type: Number,
      required: [true, "La quantité est requise (0 ou plus)"],
      min: [0, "La quantité doit être positive ou nulle"],
      default: 0,
    },

    // ============================================
    // MÉDIAS (OPTIONNELS)
    // ============================================

    image:{
      type: String,
      validate: {
        validator: function(v) {
          return /^data:image\/[a-zA-Z]+;base64,/.test(v);
        },
        message: "Image invalide. Format attendu : image/type;base64,.."
      }
    },

    imagesSecondaires: [
      {
        type: String,
        validate: {
          validator: (v) => {
            if (!v) return true;
            const regex =
              /^image\/(png|jpg|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;
            return regex.test(v);
          },
          message: "Format image invalide (doit être base64 valide)",
        },
        maxlength: [10000000, "L'image ne doit pas dépasser 10 Mo"],
      },
    ],

    // ============================================
    // RELATIONS (OBLIGATOIRES)
    // ============================================

    boutiqueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Boutique",
      required: [true, "La boutique est requise"],
      index: true,
    },

    categorieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Categorie",
      required: [true, "La catégorie est requise"],
      index: true,
    },

    // ============================================
    // VISIBILITÉ & PROMOTIONS (DÉFAUTS)
    // ============================================

    publierSurLeWeb: {
      type: Boolean,
      default: false,
    },

    enPromotion: {
      type: Boolean,
      default: false,
    },

    pourcentagePromo: {
      type: Number,
      default: 0,
      min: [0, "Le pourcentage doit être positif"],
      max: [100, "Le pourcentage ne peut pas dépasser 100%"],
    },

    remise: {
      type: Number,
      default: 0,
      min: [0, "La remise doit être positive"],
      max: [100, "La remise ne peut pas dépasser 100%"],
    },

    // ============================================
    // STATUT (DÉFAUT)
    // ============================================

    actif: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDEXES OPTIMISÉS
// ============================================

produitSchema.index(
  { nom: "text", description: "text", marque: "text" },
  {
    weights: { nom: 10, description: 5, marque: 3 },
  }
);
produitSchema.index({ boutiqueId: 1, actif: 1, publierSurLeWeb: 1 });
produitSchema.index({ categorieId: 1, actif: 1 });
produitSchema.index({ prix: 1, quantite: 1 });
produitSchema.index({ enPromotion: 1, pourcentagePromo: -1 });
produitSchema.index({ marque: 1, actif: 1 });

// ============================================
// CHAMPS VIRTUELS (CALCULS AUTOMATIQUES)
// ============================================

produitSchema.virtual("prixApresRemise").get(function () {
  if (!this.remise) return this.prix;
  return Math.round(this.prix * (1 - this.remise / 100) * 100) / 100;
});

produitSchema.virtual("prixApresPromotion").get(function () {
  if (!this.enPromotion || !this.pourcentagePromo) return this.prix;
  return Math.round(this.prix * (1 - this.pourcentagePromo / 100) * 100) / 100;
});

produitSchema.virtual("prixFinal").get(function () {
  return this.enPromotion && this.pourcentagePromo > 0
    ? this.prixApresPromotion
    : this.remise > 0
    ? this.prixApresRemise
    : this.prix;
});

produitSchema.virtual("imageUrl").get(function () {
  return (
    this.image ||
    "image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhESMIAAAAABJRU5ErkJggg=="
  );
});

produitSchema.virtual("estDisponible").get(function () {
  return this.actif && this.quantite > 0;
});

// ============================================
// HOOKS MONGOOSE (SYNCHRONES - CORRIGÉS)
// ============================================

// Génération référence auto si non fournie
produitSchema.pre("save", function (next) {
  if (this.isNew && !this.reference) {
    const timestamp = Date.now().toString(36).slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.reference = `PROD-${timestamp}-${random}`;
  }
  next; // ✅ Correctement appelé
});

// Cohérence promo/remise (promo prioritaire)
produitSchema.pre("save", function (next) {
  if (this.enPromotion && this.pourcentagePromo > 0) {
    this.remise = 0; // Forcer remise à 0 si en promotion
  }
  next; // ✅ Correctement appelé
});

// ============================================
// TRANSFORMATION JSON (PROPRE POUR LE FRONTEND)
// ============================================

produitSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });

  // Formater les dates
  if (obj.createdAt) obj.createdAt = new Date(obj.createdAt).toISOString();
  if (obj.updatedAt) obj.updatedAt = new Date(obj.updatedAt).toISOString();

  // Supprimer champs internes
  delete obj.__v;

  // Ajouter champs calculés utiles
  obj.prixFinal = this.prixFinal;
  obj.estDisponible = this.estDisponible;

  return obj;
};

module.exports = mongoose.model("Produit", produitSchema);
