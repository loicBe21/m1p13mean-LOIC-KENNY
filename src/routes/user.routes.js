const express = require("express");
const router = express.Router();


const {
  getList,
  getUserEnAttente,
} = require("../controllers/user.controllers");


const authJwtMiddleware = require("../middlewares/authJwt.middelware");
const authorizeRoles = require("../middlewares/authorizeRoles.middelware");




// ============================================
// PROTECTION DE TOUTES LES ROUTES
// ============================================

router.use(authJwtMiddleware);


router.get("/list", getList);
router.get("/enAttente", getUserEnAttente);


module.exports = router;