const { verifyAccessToken } = require('../auth/jwt');
const ApiError = require('../utils/ApiError');

// Same cookie name User Service issues (apps/user-service/src/auth/cookies.js
// ACCESS_TOKEN_COOKIE) — this service only ever reads it, never sets it.
const ACCESS_TOKEN_COOKIE = 'accessToken';

// Identical extraction order and logic to
// apps/user-service/src/middlewares/auth.middleware.js: Bearer header first,
// then the accessToken cookie.
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
