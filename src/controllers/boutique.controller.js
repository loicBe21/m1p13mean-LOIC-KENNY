// ============================================
// Contrôleur Boutique -
// ============================================

const {
  createBoutique,
  getAllBoutiques,
  getBoutiqueById,
  updateBoutique,
  deleteBoutique,
  searchBoutiques,
  getBoutiquesActives,
  getBoutiquesInactives,
  activerBoutique,
  desactiverBoutique,
  getBoutiquesPaginated,
  assignUserToBoutique,
} = require("../services/boutique.service");

// ============================================
// CONTRÔLEURS
// ============================================






const create = async (req, res) => {
  try {
    const boutique = await createBoutique(req.body);
    res.status(201).json({
      success: true,
      message: "Boutique créée avec succès",
      data: boutique,
    });
  } catch (error) {
    if (error.message.includes("déjà utilisé")) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Erreur de validation",
        details: Object.values(error.errors).map((e) => e.message),
      });
    }
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

const getAll = async (req, res) => {
  try {
    const boutiques = await getAllBoutiques(req.query);
    res.json({ success: true, count: boutiques.length, data: boutiques });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

const getById = async (req, res) => {
  try {
    const boutique = await getBoutiqueById(req.params.id);
    if (!boutique)
      return res
        .status(404)
        .json({ success: false, error: "Boutique non trouvée" });
    res.json({ success: true, data: boutique });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, error: "ID invalide" });
    }
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

const update = async (req, res) => {
  try {
    const boutique = await updateBoutique(req.params.id, req.body);
    res.json({
      success: true,
      message: "Boutique mise à jour avec succès",
      data: boutique,
    });
  } catch (error) {
    if (error.message === "Boutique non trouvée") {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

const remove = async (req, res) => {
  try {
    await deleteBoutique(req.params.id);
    res.json({ success: true, message: "Boutique supprimée avec succès" });
  } catch (error) {
    if (error.message === "Boutique non trouvée") {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

const search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q)
      return res
        .status(400)
        .json({ success: false, error: 'Paramètre "q" requis' });

    const boutiques = await searchBoutiques(q);
    res.json({
      success: true,
      count: boutiques.length,
      query: q,
      data: boutiques,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

const getActives = async (req, res) => {
  try {
    const boutiques = await getBoutiquesActives();
    res.json({ success: true, count: boutiques.length, data: boutiques });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

const getInactives = async (req, res) => {
  try {
    const boutiques = await getBoutiquesInactives();
    res.json({ success: true, count: boutiques.length, data: boutiques });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

const activate = async (req, res) => {
  try {
    const boutique = await activerBoutique(req.params.id);
    res.json({
      success: true,
      message: "Boutique activée avec succès",
      data: boutique,
    });
  } catch (error) {
    if (error.message === "Boutique non trouvée") {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

const deactivate = async (req, res) => {
  try {
    const boutique = await desactiverBoutique(req.params.id);
    res.json({
      success: true,
      message: "Boutique désactivée avec succès",
      data: boutique,
    });
  } catch (error) {
    if (error.message === "Boutique non trouvée") {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};


const getListPaginated = async (req, res) => {
  try {
    // Définir les filtres par défaut si nécessaire
    const defaultFilters = {};

    // Appliquer la pagination et les filtres
    const result = await getBoutiquesPaginated(req.query, defaultFilters);

    res.json({
      success: true,
      data: result, // Structure déjà formatée par paginateAndFilter
    });
  } catch (error) {
    console.error(
      "❌ [BoutiqueController] Erreur getListPaginated:",
      error.message
    );
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des boutiques paginées",
    });
  }
};





/**
 * @desc    Assigner un utilisateur boutique à une boutique
 * @route   POST /api/boutiques/:id/assign-user
 * @access  Private/Admin
 */
const assignUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id: boutiqueId } = req.params;

    // Validation des données
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "L'ID de l'utilisateur est requis",
      });
    }

    // Appeler le service
    const user = await assignUserToBoutique(boutiqueId, userId);

    res.json({
      success: true,
      message: "Utilisateur assigné à la boutique avec succès",
      user,
    });
  } catch (error) {
    if (
      error.message.includes("non trouvée") ||
      error.message.includes("non trouvé")
    ) {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (
      error.message.includes("rôle") ||
      error.message.includes("déjà assigné")
    ) {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};






// ============================================
// EXPORT
// ============================================

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
  search,
  getActives,
  getInactives,
  activate,
  deactivate,
  getListPaginated,
  assignUser,
};
