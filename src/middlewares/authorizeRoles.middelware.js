// ============================================
// src/middleware/authorizeRoles.middleware.js
// Middleware d'autorisation par rôle
// ============================================


/**
 * 
 * @param  {...any} roles 
 * @returns {next}
 * 
 * Middelware pour un role precis ex  (role admin et boutique uniquement etc)
 * verifie le role de l'user dans l'objet req 
 * a appeler apres authJwt.middelware
 */

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Accès refusé' 
      });
    }
    next();
  };
};

module.exports = authorizeRoles;