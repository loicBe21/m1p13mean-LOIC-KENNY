// ============================================
// src/utils/apiError.js
// Erreurs métier standardisées - Générées par Modèle/Service
// ============================================

/**
 * Erreur API standardisée
 * Utilisée par les modèles et services pour signaler des erreurs métier
 */
class ApiError extends Error {
  constructor(message, statusCode = 400, details = [], code = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;      // [{ field, reason, value? }]
    this.code = code;            // Code métier (ex: 'DUPLICATE_REFERENCE')
    this.timestamp = new Date().toISOString();
    
    // Capturer stack proprement
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================
// FACTORIES D'ERREURS MÉTIER COURANTES
// À utiliser dans les modèles/services
// ============================================

const createValidationError = (message, details = []) => 
  new ApiError(message, 400, details, 'VALIDATION_ERROR');

const createNotFoundError = (resource, id) => 
  new ApiError(`${resource} non trouvé`, 404, [
    { field: 'id', reason: `Aucun ${resource} trouvé avec l'ID "${id}"` }
  ], 'NOT_FOUND');

const createDuplicateError = (field, value) => 
  new ApiError(`Valeur déjà utilisée`, 409, [
    { 
      field, 
      reason: `La valeur "${value}" existe déjà pour le champ "${field}"`,
      value 
    }
  ], 'DUPLICATE_KEY');

const createForbiddenError = (reason) => 
  new ApiError('Accès refusé', 403, [
    { field: 'authorization', reason }
  ], 'FORBIDDEN');

const createUnauthorizedError = (reason = 'Non authentifié') => 
  new ApiError(reason, 401, [
    { field: 'authentication', reason: 'Veuillez vous connecter pour accéder à cette ressource' }
  ], 'UNAUTHORIZED');

module.exports = {
  ApiError,
  createValidationError,
  createNotFoundError,
  createDuplicateError,
  createForbiddenError,
  createUnauthorizedError
};