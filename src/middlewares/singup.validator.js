// ============================================
// src/middleware/signup.validator.js
// Validation inscription
// ============================================

const { emailExists } = require("../services/auth.service");

const signupValidator = async (req, res, next) => {
  try {
    const { nom, email, motDePasse, role, boutiqueId, telephone, adresse } =
      req.body;

    // Validation de base
    if (!nom || !email || !motDePasse) {
      return res.status(400).json({
        success: false,
        error: "Nom, email et mot de passe sont requis",
      });
    }

    // Vérifier email unique
    const emailExistsResult = await emailExists(email);
    if (emailExistsResult) {
      return res.status(400).json({
        success: false,
        error: "Cet email est déjà utilisé",
      });
    }

    // Validation rôle
    const validRoles = ["admin", "boutique", "client", "boutique_en_attente"];
    const userRole = role || "client";

    if (!validRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        error: "Rôle invalide",
      });
    }

    // Validation contraintes par rôle
    if (userRole === "boutique" && !boutiqueId) {
      return res.status(400).json({
        success: false,
        error: 'boutiqueId requis pour le rôle "boutique"',
      });
    }

    if (userRole === "client") {
      if (!adresse || !adresse.rue || !adresse.ville || !adresse.codePostal) {
        return res.status(400).json({
          success: false,
          error: 'Adresse complète requise pour le rôle "client"',
        });
      }
    }

    // Normaliser les données
    req.body = {
      nom: nom.trim(),
      email: email.toLowerCase().trim(),
      motDePasse: motDePasse.trim(),
      role: userRole,
      boutiqueId: userRole === "boutique" ? boutiqueId : undefined,
      telephone: telephone ? telephone.trim() : undefined,
      adresse:
        userRole === "client"
          ? {
              rue: adresse.rue.trim(),
              ville: adresse.ville.trim(),
              codePostal: adresse.codePostal.trim(),
              pays: adresse.pays ? adresse.pays.trim() : "France",
            }
          : undefined,
    };

    next();
  } catch (error) {
     /* throw error; */
    console.error(" [SignupValidator] Erreur:", error.message);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la validation",
    });
  }
};

module.exports = signupValidator;
