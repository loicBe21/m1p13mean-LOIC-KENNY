// src/validators/phoneValidator.js

const { PATTERNS, ERROR_MESSAGES } = require("./constants");

/**
 * Validateur téléphone réutilisable
 */
const phoneValidator = (options = {}) => {
  const { required = false, trim = true } = options;

  return {
    type: String,
    required: required ? [true, ERROR_MESSAGES.INVALID_PHONE] : false,
    trim: trim,
    match: [PATTERNS.PHONE, ERROR_MESSAGES.INVALID_PHONE],
  };
};

const phoneSimple = {
  type: String,
  required: false,
  trim: true,
  match: [PATTERNS.PHONE, ERROR_MESSAGES.INVALID_PHONE],
};

const phoneRequired = {
  type: String,
  required: [true, ERROR_MESSAGES.INVALID_PHONE],
  trim: true,
  match: [PATTERNS.PHONE, ERROR_MESSAGES.INVALID_PHONE],
};

module.exports = {
  phoneValidator,
  phoneSimple,
  phoneRequired,
};
