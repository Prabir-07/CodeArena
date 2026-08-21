const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    service: 'problem-service',
    status: 'healthy',
  });
};

module.exports = { getHealth };
