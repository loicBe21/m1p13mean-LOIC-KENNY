const { getAllUsers, getUsersByRole } = require("../services/user.service");
const { success, error } = require("../utils/responseHandler");


const getList = async (req, res) => {
    try {
        const filter = {}
        const result = await getAllUsers(filter);
        res.json({ success: true, result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: "Erreur serveur" });
    }
};

const getUserEnAttente = async (req, res) => {
    try {
      const users = await getUsersByRole("boutique_en_attente");

      return success(res, 200, "les utilisateur en attente", {
        users,
        totalUsers: users.length - 1, 
      });
    } catch (err) {
      return error(res, err);
    }
}


module.exports = {
  getList,
  getUserEnAttente,
};