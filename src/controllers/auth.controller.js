// ============================================
// src/controllers/auth.controller.js
// Contrôleur d'authentification
// ============================================

const { registerUser, loginUser } = require("../services/auth.service");

const register = async (req, res) => {
  try {
    const { user, token } = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "Inscription réussie",
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
    
  }
};

const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    const result = await loginUser(email, motDePasse);

    if (!result) {
      return res.status(401).json({
        success: false,
        error: "Identifiants invalides",
      });
    }

    res.json({
      success: true,
      message: "Connexion réussie",
      data: {
        user: result.user.toJSON(),
        token: result.token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
