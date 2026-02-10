// ============================================
// src/middleware/auth/authorizeRoles.middleware.js
// Middleware d'autorisation par rôle
// ============================================

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