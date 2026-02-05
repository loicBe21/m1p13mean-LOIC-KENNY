// src/validators/imageValidator.js

const { PATTERNS, ERROR_MESSAGES, DEFAULTS } = require("./constants");

/**
 * Validateur image base64 réutilisable
 * @param {Object} options - Options de validation
 * @param {boolean} options.required - Champ obligatoire
 * @param {number} options.maxSize - Taille max en bytes
 * @param {Array} options.allowedTypes - Types autorisés ['png', 'jpg', ...]
 * @returns {Object} Configuration Mongoose
 */
const imageValidator = (options = {}) => {
  const {
    required = false,
    maxSize = DEFAULTS.IMAGE_MAX_SIZE,
    allowedTypes = ["png", "jpg", "jpeg", "gif", "webp", "svg+xml"],
  } = options;

  // Créer regex dynamique selon types autorisés
  const typesPattern = allowedTypes.join("|");
  const imageRegex = new RegExp(
    `^image\\/(${typesPattern});base64,[A-Za-z0-9+/]+={0,2}$`
  );

  return {
    type: String,
    required: required ? [true, ERROR_MESSAGES.INVALID_IMAGE] : false,
    trim: true,
    validate: {
      validator: function (value) {
        if (!value && !required) return true;
        return imageRegex.test(value);
      },
      message: ERROR_MESSAGES.INVALID_IMAGE,
    },
    maxlength: [
      maxSize,
      `L'image ne doit pas dépasser ${maxSize / 1000000} Mo`,
    ],
  };
};

/**
 * Validateur image simple (optionnelle, max 5 Mo)
 */
const imageSimple = {
  type: String,
  required: false,
  trim: true,
  validate: {
    validator: function (value) {
      if (!value) return true;
      return PATTERNS.BASE64_IMAGE.test(value);
    },
    message: ERROR_MESSAGES.INVALID_IMAGE,
  },
  maxlength: [5000000, "L'image ne doit pas dépasser 5 Mo"],
};

/**
 * Validateur image obligatoire (max 10 Mo)
 */
const imageRequired = {
  type: String,
  required: [true, ERROR_MESSAGES.INVALID_IMAGE],
  trim: true,
  validate: {
    validator: function (value) {
      if (!value) return false;
      return PATTERNS.BASE64_IMAGE.test(value);
    },
    message: ERROR_MESSAGES.INVALID_IMAGE,
  },
  maxlength: [
    DEFAULTS.IMAGE_MAX_SIZE,
    `L'image ne doit pas dépasser ${DEFAULTS.IMAGE_MAX_SIZE / 1000000} Mo`,
  ],
};

/**
 * Méthode utilitaire : Extraire info d'une image base64
 * @param {String} base64String - Chaîne base64
 * @returns {Object} { type, size, data, isValid }
 */
const getImageInfo = (base64String) => {
  if (!base64String) {
    return {
      type: null,
      size: 0,
      data: null,
      isValid: false,
    };
  }

  const match = base64String.match(/^image\/([a-z+]+);base64,(.+)$/);

  if (!match) {
    return {
      type: null,
      size: 0,
      data: null,
      isValid: false,
    };
  }

  const type = match[1];
  const data = match[2];
  const size = Math.ceil(data.length * 0.75); // Approximation

  return {
    type,
    size,
    data,
    isValid: true,
    formattedSize: formatBytes(size),
  };
};

/**
 * Formater les bytes en Ko/Mo
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

module.exports = {
  imageValidator,
  imageSimple,
  imageRequired,
  getImageInfo,
  formatBytes,
};
