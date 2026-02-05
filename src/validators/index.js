// src/validators/index.js
// Point d'entrée centralisé pour tous les validateurs

// Exporter tous les validateurs
module.exports = {
  // Validateurs email
  ...require("./emailValidator"),

  // Validateurs image
  ...require("./imageValidator"),

  // Validateurs téléphone
  ...require("./phoneValidator"),

  // Validateurs texte
  ...require("./textValidator"),

  // Constantes
  ...require("./constants"),
};
