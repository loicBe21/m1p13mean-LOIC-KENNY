require("./config/env");

const app = require("./app");
const { PORT, NODE_ENV } = require("./config/env");
const connectDB = require("./config/db");

// Connexion à MongoDB
connectDB().then(() => {
  // Démarrage serveur seulement si DB OK
  app.listen(PORT, () => {
    console.log(`🚀 API running on port ${PORT} (${NODE_ENV})`);
  });
});
