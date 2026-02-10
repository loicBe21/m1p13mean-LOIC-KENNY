// ============================================
// src/routes/categorie.routes.js
// Routes Catégorie - Propres et organisées
// ============================================

const express = require("express");
const router = express.Router();
const {
  create,
  getList,
  getById,
  update,
  remove,
  activate,
  deactivate,
  getActives,
    getInactives,
  
} = require("../controllers/categorie.controller");
const authJwtMiddleware = require("../middlewares/authJwt.middelware");
const authorizeRoles = require("../middlewares/authorizeRoles.middelware");

// ============================================
// PROTECTION DES ROUTES
// ============================================

// Toutes les routes nécessitent une authentification
router.use(authJwtMiddleware);

// Routes de modification réservées aux admins
const adminRoutes = ["/:id/activate", "/:id/deactivate", "/:id"];

// Appliquer authorizeRoles('admin') aux routes de modification
router.patch("/:id/activate", authorizeRoles("admin"), activate);
router.patch("/:id/deactivate", authorizeRoles("admin"), deactivate);
router.put("/:id", authorizeRoles("admin"), update);
router.delete("/:id", authorizeRoles("admin"), remove);
router.post("/", authorizeRoles("admin"), create);

// Routes de lecture accessibles à tous les rôles authentifiés
router.get("/list", getList);
router.get("/actives", getActives);
router.get("/inactives", getInactives);
router.get("/:id", getById);

// ============================================
// EXPORT
// ============================================

module.exports = router;
