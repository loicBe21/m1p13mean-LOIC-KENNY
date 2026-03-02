// ============================================
// src/models/categorie.model.js
// Schéma Catégorie - Version corrigée et optimisée
// ============================================

const mongoose = require("mongoose");
const { imageSimple } = require("../validators"); 

// ============================================
// SCHÉMA MONGOOSE
// ============================================

const categorieSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de la catégorie est requis"], 
      trim: true,
      minlength: [2, "Le nom doit avoir au moins 2 caractères"],
      maxlength: [100, "Le nom ne peut pas dépasser 100 caractères"],
      unique: true, 
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "La description ne peut pas dépasser 500 caractères"],
    },
    image: imageSimple, 
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

// Index unique sur le nom (avec collation pour insensibilité à la casse)
/*
categorieSchema.index(
  { nom: 1 },
  {
    unique: true,
    collation: { locale: "fr", strength: 2 }, 
  }
);
*/

// Index sur statut actif
categorieSchema.index({ actif: 1 });

// Index textuel pour recherche
categorieSchema.index(
  {
    nom: "text",
    description: "text",
  },
  {
    weights: { nom: 10, description: 5 },
    name: "TextSearchIndex",
  }
);

// ============================================
// CHAMPS VIRTUELS
// ============================================

categorieSchema.virtual("imageUrl").get(function () {
  return (
    this.image ||
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhESMIAAAAABJRU5ErkJggg=="
  );
});

// Nombre de produits dans cette catégorie (à implémenter plus tard)
categorieSchema.virtual("nombreProduits", {
  ref: "Produit",
  localField: "_id",
  foreignField: "categorieId",
  count: true,
});

// ============================================
// MÉTHODES D'INSTANCE
// ============================================

categorieSchema.methods.activer = async function () {
  this.actif = true;
  return this.save();
};

categorieSchema.methods.desactiver = async function () {
  this.actif = false;
  return this.save();
};

categorieSchema.methods.estActive = function () {
  return this.actif === true;
};

// Normaliser le nom (première lettre majuscule)
categorieSchema.methods.normaliserNom = function () {
  if (this.nom) {
    this.nom =
      this.nom.charAt(0).toUpperCase() + this.nom.slice(1).toLowerCase();
  }
  return this;
};

// ============================================
// HOOKS MONGOOSE
// ============================================

// Normaliser le nom avant sauvegarde
categorieSchema.pre("save", function (next) {
  if (this.isModified("nom")) {
    this.nom = this.nom.trim();
    // Première lettre majuscule, reste en minuscules
    this.nom =
      this.nom.charAt(0).toUpperCase() + this.nom.slice(1).toLowerCase();
  }
  next;
});

// ============================================
// TRANSFORMATION JSON
// ============================================

categorieSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });

  // Formater les dates ISO
  if (obj.createdAt) obj.createdAt = new Date(obj.createdAt).toISOString();
  if (obj.updatedAt) obj.updatedAt = new Date(obj.updatedAt).toISOString();

  // Supprimer champs internes
  delete obj.__v;

  // Ajouter champs calculés utiles
  obj.estActive = this.estActive();

  return obj;
};

// ============================================
// MÉTHODES STATIQUES
// ============================================

/**
 * Recherche textuelle de catégories
 * @param {String} query - Terme de recherche
 * @returns {Array} Catégories correspondantes
 */
categorieSchema.statics.searchByText = function (query) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .collation({ locale: "fr" });
};

// ============================================
// EXPORT
// ============================================

module.exports = mongoose.model("Categorie", categorieSchema);
