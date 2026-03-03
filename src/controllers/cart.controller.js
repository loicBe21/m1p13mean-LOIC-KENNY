const { success, error } = require('../utils/responseHandler');
const cartService = require('../services/cart.service');

/**
 * POST /api/cart/preview
 * Formater le panier pour affichage (SANS authentification)
 */
const previewCart = async (req, res) => {
  try {
    const { cartItems } = req.body;
    
    if (!cartItems || !Array.isArray(cartItems)) {
      return error(res, {
        message: 'Données invalides',
        statusCode: 400,
        details: [{ field: 'cartItems', reason: 'Tableau d\'items requis' }]
      });
    }
    
    const formatted = await cartService.formatCartForPreview(cartItems);
    return success(res, 200, 'Panier formaté pour preview', formatted);
    
  } catch (err) {
    return error(res, err);
  }
};

/**
 * POST /api/cart/order
 * Valider le panier → créer commandes (AVEC authentification)
 */
const orderCart = async (req, res) => {
  try {
    const { cartItems, shippingAddress } = req.body;
    
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return error(res, {
        message: 'Panier vide',
        statusCode: 400,
        details: [{ field: 'cartItems', reason: 'Le panier doit contenir des articles' }]
      });
    }
    
    if (!shippingAddress?.trim()) {
      return error(res, {
        message: 'Adresse de livraison requise',
        statusCode: 400,
        details: [{ field: 'shippingAddress', reason: 'L\'adresse ne peut pas être vide' }]
      });
    }
    
    // Authentification déjà faite par middleware → req.user existe
    const orders = await cartService.createOrdersFromCartItems(
      req.user.id,
      cartItems,
      shippingAddress
    );
    
    return success(res, 201, `Commande(s) créée(s) pour ${orders.length} boutique(s)`, {
      orders,
      count: orders.length
    });
    
  } catch (err) {
    return error(res, err);
  }
};

module.exports = {
  previewCart,
  orderCart
};