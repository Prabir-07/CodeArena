const { verifyAccessToken } = require('../auth/jwt');
const { ACCESS_TOKEN_COOKIE } = require('../auth/cookies');

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }

  return req.cookies?.[ACCESS_TOKEN_COOKIE] || null;
}

function authenticate(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }
}

module.exports = authenticate;
