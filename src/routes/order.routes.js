// ============================================
// src/routes/order.routes.js
// Routes Commande - Version minimale
// ============================================

const express = require("express");
const router = express.Router();
const { createOrder } = require("../controllers/order.controller");
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

module.exports = router;
