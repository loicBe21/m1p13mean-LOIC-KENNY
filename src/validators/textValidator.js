// src/validators/textValidator.js

const { ERROR_MESSAGES, DEFAULTS } = require("./constants");

/**
 * Validateur texte réutilisable
 */
const textValidator = (options = {}) => {
  const {
    required = false,
    minLength = 0,
    maxLength = DEFAULTS.TEXT_MAX_LENGTH,
    field = "Texte",
    trim = true,
  } = options;

  const config = {
    type: String,
    required: required ? [true, ERROR_MESSAGES.REQUIRED(field)] : false,
    trim: trim,
  };

  if (minLength > 0) {
    config.minlength = [minLength, ERROR_MESSAGES.MIN_LENGTH(field, minLength)];
  }

  if (maxLength > 0) {
    config.maxlength = [maxLength, ERROR_MESSAGES.MAX_LENGTH(field, maxLength)];
  }

  return config;
};

/**
 * Validateur nom (2-100 caractères)
 */
const nameValidator = (field = "Nom") => ({
  type: String,
  required: [true, ERROR_MESSAGES.REQUIRED(field)],
  trim: true,
  minlength: [
    DEFAULTS.NAME_MIN_LENGTH,
    ERROR_MESSAGES.MIN_LENGTH(field, DEFAULTS.NAME_MIN_LENGTH),
  ],
  maxlength: [
    DEFAULTS.NAME_MAX_LENGTH,
    ERROR_MESSAGES.MAX_LENGTH(field, DEFAULTS.NAME_MAX_LENGTH),
  ],
});

/**
 * Validateur description (max 500 caractères)
 */
const descriptionValidator = (required = false) => ({
  type: String,
  required: required ? [true, ERROR_MESSAGES.REQUIRED("Description")] : false,
  trim: true,
  maxlength: [
    DEFAULTS.DESCRIPTION_MAX_LENGTH,
    ERROR_MESSAGES.MAX_LENGTH("Description", DEFAULTS.DESCRIPTION_MAX_LENGTH),
  ],
});

module.exports = {
  textValidator,
  nameValidator,
  descriptionValidator,
};
