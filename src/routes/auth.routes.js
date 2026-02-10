// ============================================
// src/routes/auth.routes.js
// Routes d'authentification
// ============================================

const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
} = require("../controllers/auth.controller");
const signupValidator = require("../middlewares/singup.validator");
const authJwtMiddleware = require("../middlewares/authJwt.middelware");

// Routes publiques
router.post("/login", login);
router.post("/register", signupValidator, register);


// Routes protégées
router.use(authJwtMiddleware);
router.get("/profile", getProfile);

module.exports = router;
