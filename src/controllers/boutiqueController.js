// ============================================
// src/controllers/boutiqueController.js
// Contrôleur CRUD pour les boutiques
// ============================================

const Boutique = require("../models/Boutique");

/**
 * @desc    Créer une nouvelle boutique
 * @route   POST /api/boutiques
 * @access  Public
 */
const createBoutique = async (req, res) => {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("📝 [BoutiqueController] Création d'une nouvelle boutique");
    console.log("=".repeat(60));

    // ============================================
    // EXTRACTION DES DONNÉES DU BODY
    // ============================================

    const { nom, description, image, telephone, email, actif } = req.body;

    console.log("📦 Données reçues:");
    console.log(`   - nom        : ${nom}`);
    console.log(`   - description: ${description || "non fournie"}`);
    console.log(`   - email      : ${email}`);
    console.log(`   - telephone  : ${telephone || "non fourni"}`);
    console.log(
      `   - actif      : ${actif !== undefined ? actif : "true (défaut)"}`
    );
    console.log(`   - image      : ${image ? "présente" : "absente"}`);

    // ============================================
    // VALIDATION BASIQUE CÔTÉ SERVEUR
    // ============================================

    console.log("\n Validation des données...");
    
    if (!nom) {
      console.log('❌ Erreur: Champ "nom" manquant');
      return res.status(400).json({
        success: false,
        error: 'Le champ "nom" est requis',
      });
    }
    
    
    if (!email) {
      console.log(' Erreur: Champ "email" manquant');
      return res.status(400).json({
        success: false,
        error: 'Le champ "email" est requis',
      });
    }

    console.log("Validation OK");

    // ============================================
    // CRÉATION VIA MÉTHODE STATIQUE DU MODÈLE
    // ============================================

    console.log("\n Création dans la base de données...");

    const nouvelleBoutique = await Boutique.createBoutique({
      nom,
      description,
      image,
      telephone,
      email,
      actif,
    });

    console.log(` Boutique créée avec succès`);
    console.log(`   ID : ${nouvelleBoutique._id}`);
    console.log(`   Nom: ${nouvelleBoutique.nom}`);

    // ============================================
    // ENVOI DE LA RÉPONSE AU CLIENT
    // ============================================

    console.log("\n Envoi de la réponse au client...");
    console.log("=".repeat(60) + "\n");

    return res.status(201).json({
      success: true,
      message: "Boutique créée avec succès",
      nouvelleBoutique,
    });
  } catch (error) {
    // ============================================
    // GESTION DES ERREURS
    // ============================================

    console.error("\n [BoutiqueController] Erreur createBoutique:");
    console.error(`   Type : ${error.name}`);
    console.error(`   Message : ${error.message}`);

    // Erreur de validation Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: "Erreur de validation",
        details: messages,
      });
    }

    // Email déjà utilisé (erreur personnalisée)
    if (error.message.includes("déjà utilisé")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Erreur serveur inattendue
    return res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la création de la boutique",
    });
  }
};

/**
 * @desc    Obtenir toutes les boutiques
 * @route   GET /api/boutiques
 * @access  Public
 */
const getAllBoutiques = async (req, res) => {
  try {
    const boutiques = await Boutique.getAllBoutiques();

    res.json({
      success: true,
      count: boutiques.length,
      boutiques,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des boutiques",
    });
  }
};

/**
 * @desc    Obtenir une boutique par ID
 * @route   GET /api/boutiques/:id
 * @access  Public
 */
const getBoutiqueById = async (req, res) => {
  try {
    const boutique = await Boutique.getBoutiqueById(req.params.id);

    if (!boutique) {
      return res.status(404).json({
        success: false,
        error: "Boutique non trouvée",
      });
    }

    res.json({
      success: true,
      boutique,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "ID de boutique invalide",
      });
    }

    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération de la boutique",
    });
  }
};

/**
 * @desc    Mettre à jour une boutique
 * @route   PUT /api/boutiques/:id
 * @access  Public
 */
const updateBoutique = async (req, res) => {
  try {
    const boutique = await Boutique.updateBoutique(req.params.id, req.body);

    res.json({
      success: true,
      message: "Boutique mise à jour avec succès",
      boutique,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "ID de boutique invalide",
      });
    }

    if (error.message === "Boutique non trouvée") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la mise à jour de la boutique",
    });
  }
};

/**
 * @desc    Supprimer une boutique
 * @route   DELETE /api/boutiques/:id
 * @access  Public
 */
const deleteBoutique = async (req, res) => {
  try {
    const boutique = await Boutique.deleteBoutique(req.params.id);

    res.json({
      success: true,
      message: "Boutique supprimée avec succès",
      boutique,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "ID de boutique invalide",
      });
    }

    if (error.message === "Boutique non trouvée") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la suppression de la boutique",
    });
  }
};

/**
 * @desc    Activer une boutique
 * @route   PATCH /api/boutiques/:id/activate
 * @access  Public
 */
const activateBoutique = async (req, res) => {
  try {
    const boutique = await Boutique.getBoutiqueById(req.params.id);

    if (!boutique) {
      return res.status(404).json({
        success: false,
        error: "Boutique non trouvée",
      });
    }

    await boutique.activer();

    res.json({
      success: true,
      message: "Boutique activée avec succès",
      boutique,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de l'activation de la boutique",
    });
  }
};

/**
 * @desc    Désactiver une boutique
 * @route   PATCH /api/boutiques/:id/deactivate
 * @access  Public
 */
const deactivateBoutique = async (req, res) => {
  try {
    const boutique = await Boutique.getBoutiqueById(req.params.id);

    if (!boutique) {
      return res.status(404).json({
        success: false,
        error: "Boutique non trouvée",
      });
    }

    await boutique.desactiver();

    res.json({
      success: true,
      message: "Boutique désactivée avec succès",
      boutique,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la désactivation de la boutique",
    });
  }
};

/**
 * @desc    Rechercher des boutiques
 * @route   GET /api/boutiques/search?q=...
 * @access  Public
 */
const searchBoutiques = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Le paramètre de recherche est requis",
      });
    }

    const boutiques = await Boutique.searchBoutiques(q);

    res.json({
      success: true,
      count: boutiques.length,
      query: q,
      boutiques,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la recherche",
    });
  }
};

/**
 * @desc    Obtenir les boutiques actives
 * @route   GET /api/boutiques/actives
 * @access  Public
 */
const getBoutiquesActives = async (req, res) => {
  try {
    const boutiques = await Boutique.getBoutiquesActives();

    res.json({
      success: true,
      count: boutiques.length,
      boutiques,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des boutiques actives",
    });
  }
};

/**
 * @desc    Obtenir les boutiques inactives
 * @route   GET /api/boutiques/inactives
 * @access  Public
 */
const getBoutiquesInactives = async (req, res) => {
  try {
    const boutiques = await Boutique.getBoutiquesInactives();

    res.json({
      success: true,
      count: boutiques.length,
      boutiques,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la récupération des boutiques inactives",
    });
  }
};

// Exporter toutes les méthodes
module.exports = {
  createBoutique,
  getAllBoutiques,
  getBoutiqueById,
  updateBoutique,
  deleteBoutique,
  activateBoutique,
  deactivateBoutique,
  searchBoutiques,
  getBoutiquesActives,
  getBoutiquesInactives,
};
