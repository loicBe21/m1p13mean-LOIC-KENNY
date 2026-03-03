// ============================================
// src/controllers/categorie.controller.js
// Contrôleur Catégorie - Interface HTTP légère
// ============================================

const { success, error } = require("../utils/responseHandler");

const {
  createCategorie,
  getCategoriesPaginated,
  getCategorieById,
  updateCategorie,
  deleteCategorie,
  activerCategorie,
  desactiverCategorie,
  getCategoriesActives,
  getCategoriesInactives,
  getCategoriesWithProductCount,
} = require("../services/categorie.service");

// ============================================
// CONTRÔLEURS
// ============================================

const create = async (req, res) => {
  try {
    const categorie = await createCategorie(req.body);
    res.status(201).json({
      success: true,
      message: "Catégorie créée avec succès",
      categorie,
    });
  } catch (error) {
    if (error.message.includes("existe déjà")) {
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

const getList = async (req, res) => {
  try {
    const result = await getCategoriesPaginated(req.query);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

const getById = async (req, res) => {
  try {
    const categorie = await getCategorieById(req.params.id);
    if (!categorie)
      return res
        .status(404)
        .json({ success: false, error: "Catégorie non trouvée" });
    res.json({ success: true, categorie });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, error: "ID invalide" });
    }
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

const update = async (req, res) => {
  try {
    const categorie = await updateCategorie(req.params.id, req.body);
    res.json({
      success: true,
      message: "Catégorie mise à jour avec succès",
      categorie,
    });
  } catch (error) {
    if (
      error.message === "Catégorie non trouvée" ||
      error.message.includes("existe déjà")
    ) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

const remove = async (req, res) => {
  try {
    await deleteCategorie(req.params.id);
    res.json({ success: true, message: "Catégorie supprimée avec succès" });
  } catch (error) {
    if (error.message === "Catégorie non trouvée") {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

const activate = async (req, res) => {
  try {
    const categorie = await activerCategorie(req.params.id);
    res.json({
      success: true,
      message: "Catégorie activée avec succès",
      categorie,
    });
  } catch (error) {
    if (error.message === "Catégorie non trouvée") {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

const deactivate = async (req, res) => {
  try {
    const categorie = await desactiverCategorie(req.params.id);
    res.json({
      success: true,
      message: "Catégorie désactivée avec succès",
      categorie,
    });
  } catch (error) {
    if (error.message === "Catégorie non trouvée") {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

const getActives = async (req, res) => {
  try {
    const categories = await getCategoriesActives();
    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};




/**
 * GET /api/categories/public/with-count
 * Récupérer les catégories avec comptage produits (public)
 */
const getCategoriesWithCount = async (req, res) => {
  try {
    const categories = await getCategoriesWithProductCount();
    
    return success(res, 200, 'Catégories récupérées avec succès', {
      categories,
      totalCategories: categories.length - 1, // Exclut "Tous les produits"
      totalProducts: categories[0].produitCount
    });
    
  } catch (err) {
    return error(res, err);
  }
};




const getInactives = async (req, res) => {
  try {
    const categories = await getCategoriesInactives();
    res.json({ success: true, count: categories.length, categories });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};

// ============================================
// EXPORT
// ============================================

module.exports = {
  create,
  getList,
  getById,
  update,
  remove,
  activate,
  deactivate,
  getActives,
  getInactives,
  getCategoriesWithCount,
};
