exports.check = (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    timestamp: Date.now(),
  });
};
