// ============================================
// src/routes/boutiqueRoutes.js
// Routes API pour les boutiques
// ============================================

const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/boutiqueController");

// ============================================
// ROUTES PUBLIQUES
// ============================================

/**
 * @route   GET /api/boutiques
 * @desc    Obtenir toutes les boutiques
 * @access  Public
 */
router.get("/", getAllBoutiques);

/**
 * @route   GET /api/boutiques/actives
 * @desc    Obtenir les boutiques actives
 * @access  Public
 */
router.get("/actives", getBoutiquesActives);

/**
 * @route   GET /api/boutiques/inactives
 * @desc    Obtenir les boutiques inactives
 * @access  Public
 */
router.get("/inactives", getBoutiquesInactives);

/**
 * @route   GET /api/boutiques/search
 * @desc    Rechercher des boutiques
 * @access  Public
 */
router.get("/search", searchBoutiques);

/**
 * @route   GET /api/boutiques/:id
 * @desc    Obtenir une boutique par ID
 * @access  Public
 */
router.get("/:id", getBoutiqueById);

/**
 * @route   POST /api/boutiques
 * @desc    Créer une nouvelle boutique
 * @access  Public
 */
router.post("/", createBoutique);

/**
 * @route   PUT /api/boutiques/:id
 * @desc    Mettre à jour une boutique
 * @access  Public
 */
router.put("/:id", updateBoutique);

/**
 * @route   DELETE /api/boutiques/:id
 * @desc    Supprimer une boutique
 * @access  Public
 */
router.delete("/:id", deleteBoutique);

/**
 * @route   PATCH /api/boutiques/:id/activate
 * @desc    Activer une boutique
 * @access  Public
 */
router.patch("/:id/activate", activateBoutique);

/**
 * @route   PATCH /api/boutiques/:id/deactivate
 * @desc    Désactiver une boutique
 * @access  Public
 */
router.patch("/:id/deactivate", deactivateBoutique);

module.exports = router;
