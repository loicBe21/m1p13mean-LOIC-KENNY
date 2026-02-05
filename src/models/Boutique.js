// ============================================
// src/models/Boutique.js
// Modèle Boutique - Version hybride optimisée
// ============================================

const mongoose = require("mongoose");
const { imageSimple, phoneSimple, emailRequired } = require("../validators");

// ============================================
// SCHÉMA AVEC VALIDATION INTÉGRÉE
// ============================================

const boutiqueSchema = new mongoose.Schema(
  {
    // ============================================
    // CHAMP OBLIGATOIRE
    // ============================================

    nom: {
      type: String,
      required: [true, "Le nom de la boutique est requis"],
      trim: true,
      minlength: [2, "Le nom doit avoir au moins 2 caractères"],
      maxlength: [100, "Le nom ne peut pas dépasser 100 caractères"],
    },

    // ============================================
    // CHAMPS OPTIONNELS
    // ============================================

    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: [500, "La description ne peut pas dépasser 500 caractères"],
    },

    // ============================================
    // IMAGE EN BASE64
    // ============================================

    image: imageSimple,

    // ============================================
    // COORDONNÉES
    // ============================================

    telephone: phoneSimple,

    email: emailRequired,

    // ============================================
    // STATUT
    // ============================================

    actif: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true, // Crée automatiquement createdAt et updatedAt

    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDEXES
// ============================================

boutiqueSchema.index({ nom: "text" });
boutiqueSchema.index({ actif: 1 });
boutiqueSchema.index({ email: 1 });

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
  return this.nom.length > 30 ? this.nom.substring(0, 30) + "..." : this.nom;
});

// ============================================
// MÉTHODES D'INSTANCE
// ============================================

/**
 * Activer la boutique
 */
boutiqueSchema.methods.activer = async function () {
  this.actif = true;
  return await this.save();
};

/**
 * Désactiver la boutique
 */
boutiqueSchema.methods.desactiver = async function () {
  this.actif = false;
  return await this.save();
};

/**
 * Vérifier si la boutique est active
 */
boutiqueSchema.methods.estActive = function () {
  return this.actif === true;
};

// ============================================
// MÉTHODES STATIQUES (Approche réutilisable)
// ============================================

/**
 * Obtenir toutes les boutiques
 */
boutiqueSchema.statics.getAllBoutiques = async function () {
  try {
    return await this.find().sort({ nom: 1 });
  } catch (error) {
    throw new Error("Erreur lors de la récupération des boutiques");
  }
};

/**
 * Obtenir une boutique par ID
 */
boutiqueSchema.statics.getBoutiqueById = async function (id) {
  try {
    return await this.findById(id);
  } catch (error) {
    throw new Error("Erreur lors de la récupération de la boutique");
  }
};

/**
 * Obtenir une boutique par email
 */
boutiqueSchema.statics.getBoutiqueByEmail = async function (email) {
  try {
    return await this.findOne({ email });
  } catch (error) {
    throw new Error("Erreur lors de la récupération de la boutique");
  }
};

/**
 * Créer une nouvelle boutique (avec validation)
 */
boutiqueSchema.statics.createBoutique = async function (boutiqueData) {
  try {
    // Vérifier si email existe déjà
    const existingEmail = await this.findOne({ email: boutiqueData.email });
    if (existingEmail) {
      throw new Error("Cet email est déjà utilisé par une autre boutique");
    }

    // Créer la boutique
    const boutique = await this.create(boutiqueData);
    return boutique;
  } catch (error) {
    throw error;
  }
};

/**
 * Mettre à jour une boutique
 */
boutiqueSchema.statics.updateBoutique = async function (id, updateData) {
  try {
    const boutique = await this.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!boutique) {
      throw new Error("Boutique non trouvée");
    }

    return boutique;
  } catch (error) {
    throw error;
  }
};

/**
 * Supprimer une boutique
 */
boutiqueSchema.statics.deleteBoutique = async function (id) {
  try {
    const boutique = await this.findByIdAndDelete(id);

    if (!boutique) {
      throw new Error("Boutique non trouvée");
    }

    return boutique;
  } catch (error) {
    throw error;
  }
};

/**
 * Rechercher des boutiques
 */
boutiqueSchema.statics.searchBoutiques = async function (query) {
  try {
    return await this.find({
      $or: [{ nom: new RegExp(query, "i") }, { email: new RegExp(query, "i") }],
    }).sort({ nom: 1 });
  } catch (error) {
    throw new Error("Erreur lors de la recherche de boutiques");
  }
};

/**
 * Obtenir les boutiques actives
 */
boutiqueSchema.statics.getBoutiquesActives = async function () {
  try {
    return await this.find({ actif: true }).sort({ nom: 1 });
  } catch (error) {
    throw new Error("Erreur lors de la récupération des boutiques actives");
  }
};

/**
 * Obtenir les boutiques inactives
 */
boutiqueSchema.statics.getBoutiquesInactives = async function () {
  try {
    return await this.find({ actif: false }).sort({ nom: 1 });
  } catch (error) {
    throw new Error("Erreur lors de la récupération des boutiques inactives");
  }
};

// ============================================
// MÉTHODE toJSON PERSONNALISÉE
// ============================================

boutiqueSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });

  // Formater les dates
  if (obj.createdAt) {
    obj.createdAt = new Date(obj.createdAt).toISOString();
  }
  if (obj.updatedAt) {
    obj.updatedAt = new Date(obj.updatedAt).toISOString();
  }

  // Supprimer le champ de version
  delete obj.__v;

  return obj;
};

// ============================================
// EXPORT
// ============================================

const Boutique = mongoose.model("Boutique", boutiqueSchema);

module.exports = Boutique;
