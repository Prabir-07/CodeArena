const crypto = require('crypto');

// bcrypt (used for passwords) silently truncates input at 72 bytes, which makes it
// unsafe for hashing refresh tokens: JWTs routinely exceed that length, and two
// tokens for the same user share an identical prefix (header + "sub"/"role" claims),
// so bcrypt would treat them as equal. SHA-256 has no such truncation.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  hashToken,
};
