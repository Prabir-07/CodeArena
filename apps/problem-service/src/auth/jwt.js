const jwt = require('jsonwebtoken');
const config = require('../config/env');

// Verification only — this service never issues tokens, only the User
// Service does. Same secret, same call shape as
// apps/user-service/src/auth/jwt.js's verifyAccessToken.
function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

module.exports = {
  verifyAccessToken,
};
