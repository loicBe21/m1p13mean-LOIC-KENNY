// ============================================
// src/utils/validationUtils.js
// Utilitaires de validation réutilisables pour montants et pourcentages
// ============================================

const { createValidationError } = require("./apiError");

/**
 * Arrondir une valeur monétaire à 2 décimales
 * @param {Number} value - Valeur à arrondir
 * @returns {Number} Valeur arrondie
 */
const roundTo2Decimals = (value) => {
  if (value === undefined || value === null || isNaN(value)) return 0;
  return Math.round(value * 100) / 100;
};

/**
 * Valider un pourcentage (strict - bloque si invalide)
 * @param {any} value - Valeur à valider
 * @param {String} fieldName - Nom du champ pour le message d'erreur
 * @param {String} context - Contexte additionnel (optionnel)
 * @throws {ApiError} Si validation échoue
 * @returns {Number} Pourcentage validé
 */
const validatePercentage = (value, fieldName, context = "") => {
  if (value === undefined || value === null || value === "") {
    throw createValidationError(`${fieldName} est requis`, [
      { field: fieldName, reason: `${fieldName} ne peut pas être vide` },
    ]);
  }

  const num = parseFloat(value);

  if (isNaN(num)) {
    throw createValidationError(`${fieldName} invalide`, [
      {
        field: fieldName,
        reason: `${
          context ? `[${context}] ` : ""
        }La valeur "${value}" n'est pas un nombre valide`,
      },
    ]);
  }

  if (num < 0 || num > 100) {
    throw createValidationError(`${fieldName} hors limites`, [
      {
        field: fieldName,
        reason: `${
          context ? `[${context}] ` : ""
        }Doit être entre 0 et 100%, reçu: ${num}`,
      },
    ]);
  }

  return num;
};

/**
 * Assainir un pourcentage (correction silencieuse + warning)
 * @param {any} value - Valeur à assainir
 * @param {String} context - Contexte pour les logs
 * @returns {Number} Pourcentage assaini (0-100)
 */
const sanitizePercentage = (value, context = "") => {
  // Valeurs vides → 0
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  // Conversion en nombre
  const num = parseFloat(value);

  // Valeur non numérique → 0 avec warning
  if (isNaN(num)) {
    console.warn(
      `⚠️ [ValidationUtils] Pourcentage invalide ${
        context ? `(${context})` : ""
      }: "${value}" → corrigé à 0`
    );
    return 0;
  }

  // Correction valeurs extrêmes
  if (num < 0) {
    console.warn(
      `⚠️ [ValidationUtils] Pourcentage négatif ${
        context ? `(${context})` : ""
      }: ${num}% → corrigé à 0`
    );
    return 0;
  }

  if (num > 100) {
    console.warn(
      `⚠️ [ValidationUtils] Pourcentage excessif ${
        context ? `(${context})` : ""
      }: ${num}% → corrigé à 100`
    );
    return 100;
  }

  return num;
};

/**
 * Valider une valeur monétaire (strict - bloque si invalide)
 * @param {any} value - Valeur à valider
 * @param {String} fieldName - Nom du champ
 * @param {Object} options - Options de validation
 * @param {Number} options.min - Valeur minimale (défaut: 0)
 * @param {Number} options.max - Valeur maximale (optionnel)
 * @throws {ApiError} Si validation échoue
 * @returns {Number} Valeur validée et arrondie
 */
const validateMonetaryValue = (value, fieldName, options = {}) => {
  const { min = 0, max } = options;

  if (value === undefined || value === null || value === "") {
    throw createValidationError(`${fieldName} est requis`, [
      { field: fieldName, reason: `${fieldName} ne peut pas être vide` },
    ]);
  }

  const num = parseFloat(value);

  if (isNaN(num)) {
    throw createValidationError(`${fieldName} invalide`, [
      {
        field: fieldName,
        reason: `La valeur "${value}" n'est pas un nombre valide`,
      },
    ]);
  }

  if (num < min) {
    throw createValidationError(`${fieldName} trop bas`, [
      { field: fieldName, reason: `Doit être ≥ ${min}, reçu: ${num}` },
    ]);
  }

  if (max !== undefined && num > max) {
    throw createValidationError(`${fieldName} trop élevé`, [
      { field: fieldName, reason: `Doit être ≤ ${max}, reçu: ${num}` },
    ]);
  }

  return roundTo2Decimals(num);
};

/**
 * Assainir une valeur monétaire (correction silencieuse)
 * @param {any} value - Valeur à assainir
 * @param {String} context - Contexte pour les logs
 * @returns {Number} Valeur assainie (≥0, arrondie)
 */
const sanitizeMonetaryValue = (value, context = "") => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const num = parseFloat(value);

  if (isNaN(num)) {
    console.warn(
      `⚠️ [ValidationUtils] Valeur monétaire invalide ${
        context ? `(${context})` : ""
      }: "${value}" → corrigée à 0`
    );
    return 0;
  }

  if (num < 0) {
    console.warn(
      `⚠️ [ValidationUtils] Valeur monétaire négative ${
        context ? `(${context})` : ""
      }: ${num} → corrigée à 0`
    );
    return 0;
  }

  return roundTo2Decimals(num);
};

/**
 * Calculer un montant de remise à partir d'un pourcentage
 * @param {Number} baseAmount - Montant de base
 * @param {Number} percentage - Pourcentage de remise
 * @param {String} context - Contexte pour les logs d'erreur
 * @returns {Number} Montant de remise (arrondi, ≥0)
 */
const calculateDiscountAmount = (baseAmount, percentage, context = "") => {
  const sanitizedBase = sanitizeMonetaryValue(baseAmount, `${context}.base`);
  const sanitizedPct = sanitizePercentage(percentage, `${context}.percentage`);

  const amount = (sanitizedBase * sanitizedPct) / 100;
  return sanitizeMonetaryValue(amount, `${context}.result`);
};

/**
 * Calculer un sous-total après remise
 * @param {Number} baseAmount - Montant de base
 * @param {Number} discountAmount - Montant de remise
 * @param {String} context - Contexte pour les logs
 * @returns {Number} Sous-total (arrondi, ≥0)
 */
const calculateSubtotal = (baseAmount, discountAmount, context = "") => {
  const sanitizedBase = sanitizeMonetaryValue(baseAmount, `${context}.base`);
  const sanitizedDiscount = sanitizeMonetaryValue(
    discountAmount,
    `${context}.discount`
  );

  const subtotal = sanitizedBase - sanitizedDiscount;
  return sanitizeMonetaryValue(subtotal, `${context}.result`);
};

module.exports = {
  roundTo2Decimals,
  validatePercentage,
  sanitizePercentage,
  validateMonetaryValue,
  sanitizeMonetaryValue,
  calculateDiscountAmount,
  calculateSubtotal,
};
