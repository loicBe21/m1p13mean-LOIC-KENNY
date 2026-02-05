// src/validators/constants.js

/**
 * Constantes de validation partagées
 */

// Regex patterns
const PATTERNS = {
  // Email standard
  EMAIL: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
  
  // Téléphone français
  PHONE: /^0[1-9](?:[\s.-]*\d{2}){4}$/,
  
  // Base64 image
  BASE64_IMAGE: /^image\/(png|jpg|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/,
  
  // URL
  URL: /^https?:\/\/.+/,
  
  // Code postal français
  POSTAL_CODE_FR: /^\d{5}$/,
  
  // UUID
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
};

// Messages d'erreur standardisés
const ERROR_MESSAGES = {
  REQUIRED: field => `${field} est requis`,
  MIN_LENGTH: (field, min) => `${field} doit avoir au moins ${min} caractères`,
  MAX_LENGTH: (field, max) => `${field} ne peut pas dépasser ${max} caractères`,
  INVALID_EMAIL: 'Email invalide',
  INVALID_PHONE: 'Numéro de téléphone invalide (format: 0123456789)',
  INVALID_IMAGE: 'Image invalide. Format attendu : image/type;base64,...',
  INVALID_URL: 'URL invalide',
  INVALID_POSTAL_CODE: 'Code postal invalide (5 chiffres)',
  INVALID_UUID: 'Identifiant invalide',
  MUST_BE_BOOLEAN: 'Doit être un booléen (true/false)',
  MUST_BE_NUMBER: 'Doit être un nombre'
};

// Limites par défaut
const DEFAULTS = {
  IMAGE_MAX_SIZE: 10000000, // 10 Mo
  TEXT_MAX_LENGTH: 500,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  PASSWORD_MIN_LENGTH: 6
};

module.exports = {
  PATTERNS,
  ERROR_MESSAGES,
  DEFAULTS
};