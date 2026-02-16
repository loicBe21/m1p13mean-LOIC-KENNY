// ============================================
// src/routes/boutique.routes.js
// Routes Boutique - Propres et organisées
// ============================================

const express = require("express");
const router = express.Router();
const {
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
  createWithRelations,
  updateWithRelations
} = require("../controllers/boutique.controller");
const authJwtMiddleware = require("../middlewares/authJwt.middelware");
const authorizeRoles = require("../middlewares/authorizeRoles.middelware");

// ============================================
// PROTECTION DE TOUTES LES ROUTES
// ============================================

router.use(authJwtMiddleware);

// ============================================
// DÉFINITION DES ROUTES
// ============================================

router.post("/", create); // Créer boutique
router.get("/", getAll); // Liste toutes boutiques
router.get("/list", getListPaginated);
router.get("/search", search); // Recherche
router.get("/actives", getActives); // Boutiques actives
router.get("/inactives", getInactives); // Boutiques inactives
router.get("/:id", getById); // Détail boutique
router.put("/:id", update); // Mettre à jour
router.delete("/:id", remove); // Supprimer
router.patch("/:id/activate", activate); // Activer
router.patch("/:id/deactivate", deactivate); // Désactiver

/**
 * @route   POST /api/boutiques/:id/assign-user
 * @desc    Assigner un utilisateur boutique à une boutique
 * @access  Private/Admin
 */
router.post('/:id/assign-user', authJwtMiddleware, authorizeRoles('admin'), assignUser);


/**
 * @route   POST /api/boutiques/with-relations
 * @desc    Créer une boutique avec utilisateurs et catégories associés
 * @access  Private/Admin
 */
router.post(
  '/with-relations', 
  authJwtMiddleware, 
  authorizeRoles('admin'), 
  createWithRelations
);

/**
 * @route   PUT /api/boutiques/:id/with-relations
 * @desc    Mettre à jour une boutique avec gestion complète des relations
 * @access  Private/Admin
 */
router.put(
  '/:id/with-relations', 
  authJwtMiddleware, 
  authorizeRoles('admin'), 
  updateWithRelations
);


// ============================================
// EXPORT
// ============================================

module.exports = router;
