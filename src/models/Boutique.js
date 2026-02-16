// ============================================
// src/models/boutique.model.js
// Schéma Boutique - Version propre et minimaliste
// ============================================

const mongoose = require("mongoose");
const { imageSimple, phoneSimple, emailRequired } = require("../validators");

// ============================================
// SCHÉMA MONGOOSE
// ============================================

const boutiqueSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de la boutique est requis"],
      trim: true,
      minlength: [2, "Le nom doit avoir au moins 2 caractères"],
      maxlength: [100, "Le nom ne peut pas dépasser 100 caractères"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "La description ne peut pas dépasser 500 caractères"],
    },
    image: imageSimple,
    telephone: phoneSimple,
    email: emailRequired,
    actif: {
      type: Boolean,
      default: true,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Categorie",
        required: false,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDEXES
// ============================================

boutiqueSchema.index({ nom: "text" });
boutiqueSchema.index({ actif: 1 });
boutiqueSchema.index({ email: 1, actif: 1 });

// ============================================
// CHAMPS VIRTUELS
// ============================================

boutiqueSchema.virtual("imageUrl").get(function () {
  return (
    this.image ||
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhESMIAAAAABJRU5ErkJggg=="
  );
});

boutiqueSchema.virtual("nomCourt").get(function () {
  return this.nom.length > 30 ? `${this.nom.substring(0, 30)}...` : this.nom;
});

// ============================================
// MÉTHODES D'INSTANCE
// ============================================

boutiqueSchema.methods.activer = async function () {
  this.actif = true;
  return this.save();
};

boutiqueSchema.methods.desactiver = async function () {
  this.actif = false;
  return this.save();
};

boutiqueSchema.methods.estActive = function () {
  return this.actif === true;
};

// ============================================
// TRANSFORMATION JSON
// ============================================

boutiqueSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });

  // Formater les dates ISO
  if (obj.createdAt) obj.createdAt = new Date(obj.createdAt).toISOString();
  if (obj.updatedAt) obj.updatedAt = new Date(obj.updatedAt).toISOString();

  // Supprimer champs internes
  delete obj.__v;

  return obj;
};

// ============================================
// EXPORT
// ============================================

module.exports = mongoose.model("Boutique", boutiqueSchema);
