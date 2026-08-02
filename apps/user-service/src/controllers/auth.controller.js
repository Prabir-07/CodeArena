const authService = require('../services/auth.service');
const { setAuthCookies, clearAuthCookies, REFRESH_TOKEN_COOKIE } = require('../auth/cookies');

function requestMeta(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || null,
  };
}

async function register(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.register(req.body, requestMeta(req));

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

async function login(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body, requestMeta(req));

    setAuthCookies(res, { accessToken, refreshToken });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const incomingRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    const { accessToken, refreshToken } = await authService.refreshSession(
      incomingRefreshToken,
      requestMeta(req)
    );

    setAuthCookies(res, { accessToken, refreshToken });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const incomingRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    await authService.logout(req.user.sub, incomingRefreshToken);

    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (err) {
    next(err);
  }
}

async function logoutAll(req, res, next) {
  try {
    await authService.logoutAll(req.user.sub);

    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
};
