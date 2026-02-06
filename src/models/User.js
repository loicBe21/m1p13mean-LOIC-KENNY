/*
 shema de gestion Utilisateurs
 collection Users

*/


const mongoose = require("mongoose");
const { imageSimple, phoneSimple, emailRequired } = require("../validators");


/**
 * shema de gestion Users ( Utilisateur interne + Client)
 * roles ("Admin" | "Boutique" | "Client")
 * si client ou  admin => Boutique_id null else Boutique_id != null 
 * email / telephone requis uniquement si  client
 * 
 */


const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
      minlength: [2, "Le nom doit avoir au moins 2 caractères"],
      maxlength: [50, "Le nom ne peut pas dépasser 50 caractères"],
    },
    email: emailRequired,
    telephone: phoneSimple,
    motDePasse: {
      type: String,
      required: [true, "Le mot de passe est requis"],
      minlength: [6, "Le mot de passe doit avoir au moins 6 caractères"],
      select: false, // Ne pas retourner par défaut dans les requêtes
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "boutique", "client"],
        message: "Le rôle doit être admin, boutique ou client",
      },
      default: "client",
      required: true,
    },
    boutiqueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Boutique",
      required: function () {
        return this.role === "boutique";
      },
      validate: {
        validator: function (value) {
          if (this.role === "boutique") return value != null;
          return value == null;
        },
        message: 'Les utilisateurs "boutique" doivent avoir une boutiqueId',
      },
    },
    adresse: {
      rue: {
        type: String,
        required: function () {
          return this.role === "client";
        },
        trim: true,
      },
      ville: {
        type: String,
        required: function () {
          return this.role === "client";
        },
        trim: true,
      },
      codePostal: {
        type: String,
        required: function () {
          return this.role === "client";
        },
        match: [/^\d{5}$/, "Code postal invalide (5 chiffres)"],
        trim: true,
      },
    },
    actif: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);


// ============================================
// INDEXES POUR PERFORMANCE
// ============================================

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ boutiqueId: 1, role: 1 });


// ============================================
// MIDDLEWARES MONGOOSE (Hooks)
// ============================================

/**
 * Hook : Hashage automatique du mot de passe avant sauvegarde
 */
userSchema.pre('save', async function(next) {
  // Si le mot de passe n'est pas modifié, passer
  if (!this.isModified('motDePasse')) {
    return next();
  }
  
  try {
    console.log(' [UserSchema] Hashage du mot de passe...');
    
    // Générer un salt (10 rounds)
    const salt = await bcrypt.genSalt(10);
    console.log('    Salt généré');
    
    // Hasher le mot de passe
    this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
    console.log('    Mot de passe hashé');
    
    next();
  } catch (error) {
    console.error(' [UserSchema] Erreur hashage:', error.message);
    next(error);
  }
});


// ============================================
// MÉTHODES D'INSTANCE
// ============================================

/**
 * Méthode : Comparer le mot de passe (pour login)
 * @param {String} candidatePassword - Mot de passe à vérifier
 * @returns {Boolean} true si correspond, false sinon
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('🔑 [UserSchema] Comparaison mot de passe...');
    const isMatch = await bcrypt.compare(candidatePassword, this.motDePasse);
    console.log(`   Résultat: ${isMatch ? '✅ OK' : '❌ NOK'}`);
    return isMatch;
  } catch (error) {
    console.error('❌ [UserSchema] Erreur comparaison:', error.message);
    throw error;
  }
};


/**
 * Méthode : Vérifier si l'utilisateur est admin
 */
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

/**
 * Méthode : Vérifier si l'utilisateur est boutique
 */
userSchema.methods.isBoutique = function() {
  return this.role === 'boutique';
};

/**
 * Méthode : Vérifier si l'utilisateur est client
 */
userSchema.methods.isClient = function() {
  return this.role === 'client';
};


// ============================================
// MÉTHODES STATIQUES
// ============================================

/**
 * Méthode statique : Trouver un utilisateur par email (avec mot de passe)
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email }).select('+motDePasse');
};
