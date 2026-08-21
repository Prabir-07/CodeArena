require('./env');

const jwt = require('jsonwebtoken');

// Signed with the same secret and the same claim shape the User Service uses
// ({ sub, role }), because that is exactly what this service verifies. Nothing
// here mints a token the real User Service could not have issued.
function signToken(role, sub = `test-${role.toLowerCase()}`) {
  return jwt.sign({ sub, role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

const adminToken = () => signToken('ADMIN');
const userToken = () => signToken('USER');

// A structurally valid token signed with the wrong key — used to prove
// signature verification actually happens, rather than the payload being
// trusted as-is.
const forgedToken = () => jwt.sign({ sub: 'attacker', role: 'ADMIN' }, 'not-the-real-secret', { expiresIn: '15m' });

const internalSecret = () => process.env.INTERNAL_SERVICE_SECRET;

module.exports = {
  signToken,
  adminToken,
  userToken,
  forgedToken,
  internalSecret,
};
