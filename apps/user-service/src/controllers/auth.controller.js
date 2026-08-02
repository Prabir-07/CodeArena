const authService = require('../services/auth.service');
const { setAuthCookies } = require('../auth/cookies');

async function register(req, res, next) {
  try {
    const meta = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null,
    };

    const { user, accessToken, refreshToken } = await authService.register(req.body, meta);

    setAuthCookies(res, { accessToken, refreshToken });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
};
