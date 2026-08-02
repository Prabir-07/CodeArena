const { verifyAccessToken } = require('../auth/jwt');
const { ACCESS_TOKEN_COOKIE } = require('../auth/cookies');
const ApiError = require('../utils/ApiError');

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
    return next(new ApiError(401, 'Unauthorized'));
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (err) {
    return next(new ApiError(401, 'Unauthorized'));
  }
}

module.exports = authenticate;
