// src/validators/emailValidator.js

const { PATTERNS, ERROR_MESSAGES } = require("./constants");

/**
 * Validateur email réutilisable
 * @param {Object} options - Options de validation
 * @param {boolean} options.required - Champ obligatoire
 * @param {boolean} options.unique - Valeur unique
 * @param {boolean} options.lowercase - Convertir en minuscules
 * @param {boolean} options.trim - Supprimer espaces
 * @returns {Object} Configuration Mongoose
 */
const emailValidator = (options = {}) => {
  const {
    required = false,
    unique = false,
    lowercase = true,
    trim = true,
  } = options;

  return {
    type: String,
    required: required ? [true, ERROR_MESSAGES.INVALID_EMAIL] : false,
    lowercase: lowercase,
    trim: trim,
    match: [PATTERNS.EMAIL, ERROR_MESSAGES.INVALID_EMAIL],
    unique: unique,
  };
};

/**
 * Validateur email simple (juste le format)
 */
const emailSimple = {
  type: String,
  lowercase: true,
  trim: true,
  match: [PATTERNS.EMAIL, ERROR_MESSAGES.INVALID_EMAIL],
};

/**
 * Validateur email obligatoire
 */
const emailRequired = {
  type: String,
  required: [true, ERROR_MESSAGES.INVALID_EMAIL],
  lowercase: true,
  trim: true,
  match: [PATTERNS.EMAIL, ERROR_MESSAGES.INVALID_EMAIL],
};

module.exports = {
  emailValidator,
  emailSimple,
  emailRequired,
};
