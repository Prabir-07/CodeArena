const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    service: 'user-service',
    status: 'healthy',
  });
};

module.exports = { getHealth };
