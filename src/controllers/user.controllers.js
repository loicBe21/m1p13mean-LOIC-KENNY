const {
    getAllUsers
} = require("../services/user.service");



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


module.exports = {
    getList
};