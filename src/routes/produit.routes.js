// ============================================
// src/routes/produit.routes.js
// Routes Produit - RESTful et sécurisées
// ============================================

const express = require("express");
const router = express.Router();
const { create, update, list ,listPublic,listBackoffice } = require("../controllers/produit.controller");
const authJwtMiddleware = require("../middlewares/authJwt.middelware");
const authorizeRoles = require("../middlewares/authorizeRoles.middelware");


/**
 * @route   GET /api/produits/public
 * @desc    Catalogue public (vitrine site web)
 * @access  Public
 */
router.get('/public', listPublic);

// Middleware d'authentification pour toutes les routes
router.use(authJwtMiddleware);

// ============================================
// ENDPOINTS BOUTIQUE (rôle "boutique")
// ============================================

/**
 * @route   POST /api/produits
 * @desc    Créer un produit (boutique uniquement)
 * @access  Private/Boutique
 */
router.post("/", authorizeRoles("boutique"), create);

/**
 * @route   PUT /api/produits/:id
 * @desc    Mettre à jour un produit (boutique uniquement)
 * @access  Private/Boutique
 */
router.put("/:id", authorizeRoles("boutique" , "admin"), update);



/**
 * @route   GET /api/produits
 * @desc    Catalogue backoffice (gestion boutique)
 * @access  Private/Boutique
 */
router.get('/', authorizeRoles('boutique' , 'admin'), listBackoffice);

// ============================================
// ENDPOINTS LECTURE (tous rôles authentifiés)
// ============================================

/**
 * @route   GET /api/produits
 * @desc    Liste paginée de produits
 * @access  Private (filtres adaptés selon rôle)
 */
router.get("/", list);

module.exports = router;
