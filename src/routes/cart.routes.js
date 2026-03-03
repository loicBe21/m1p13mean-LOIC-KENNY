const express = require('express');
const router = express.Router();
const { previewCart, orderCart } = require('../controllers/cart.controller');
const authJwtMiddleware = require('../middlewares/authJwt.middelware');
const  authorizeRoles  = require('../middlewares/authorizeRoles.middelware');

/**
 * @route   POST /api/cart/preview
 * @desc    Formater le panier pour affichage (SANS authentification)
 * @access  Public
 */
router.post('/preview', previewCart);

/**
 * @route   POST /api/cart/order
 * @desc    Valider le panier → créer commandes (AVEC authentification)
 * @access  Private/Client
 */
router.post('/order', authJwtMiddleware, authorizeRoles('client'), orderCart);




module.exports = router;