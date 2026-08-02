const crypto = require('crypto');

const DEFAULT_TOKEN_BYTES = 32;

// Generates the raw, single-use token handed to the client (e.g. emailed as a
// verification/reset link). Only its hash is ever persisted.
function generateToken(bytes = DEFAULT_TOKEN_BYTES) {
  return crypto.randomBytes(bytes).toString('hex');
}

// bcrypt (used for passwords) silently truncates input at 72 bytes, which makes it
// unsafe for hashing refresh/verification/reset tokens: they routinely exceed that
// length, and tokens for the same user can share a long common prefix, so bcrypt
// would treat distinct tokens as equal. SHA-256 has no such truncation, and since
// these tokens are already high-entropy random values, a fast deterministic hash
// (rather than a slow adaptive one) is the right tool for matching them by lookup.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  generateToken,
  hashToken,
};
