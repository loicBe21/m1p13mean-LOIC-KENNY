// ============================================
// src/routes/order.routes.js
// Routes Commande - Version minimale
// ============================================

const express = require("express");
const router = express.Router();
const { createOrder, getOrdersByBoutique } = require("../controllers/order.controller");
const authJwtMiddleware = require("../middlewares/authJwt.middelware");
const authorizeRoles = require("../middlewares/authorizeRoles.middelware");

// Middleware authentification
router.use(authJwtMiddleware);

/**
 * @route   POST /api/orders
 * @desc    Créer une vente physique (boutique uniquement)
 * @access  Private/Boutique
 */
router.post("/", authorizeRoles("boutique"), createOrder);



/**
 * @route   GET /api/orders/boutique
 * @desc    Lister les commandes de la boutique authentifiée
 * @access  Private/Boutique
 * @query   status  - draft | pending | paid | completed | cancelled
 * @query   type    - in_store | online
 * @query   page    - numéro de page (défaut: 1)
 * @query   limit   - items par page (défaut: 10, max: 50)
 */
router.get('/boutique', authorizeRoles('boutique'), getOrdersByBoutique);



/*
# Toutes les commandes
GET /api/orders/boutique

# Filtrer par statut
GET /api/orders/boutique?status=pending

# Filtrer par type
GET /api/orders/boutique?type=online

# Combiné + pagination
GET /api/orders/boutique?status=completed&type=in_store&page=2&limit=5

*/

module.exports = router;
