const routeNotFoundMiddelware = function (req, res, next) {
    res.status(404).json({
      succes: false,
      error: `Route non trouvée: ${req.method} ${req.url}`,
    });

}


module.exports = routeNotFoundMiddelware;