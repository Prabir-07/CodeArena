const prisma = require('../config/prisma');

function createPasswordResetToken(data, client = prisma) {
  return client.passwordResetToken.create({ data });
}

function findByHash(tokenHash, client = prisma) {
  return client.passwordResetToken.findFirst({ where: { tokenHash } });
}

// Unscoped by design: the caller (auth.service.js) only reaches this after
// findByHash matched the raw token, so possession of the token is itself the
// authorization check — there is no separate userId to scope against here.
function deleteById(id, client = prisma) {
  return client.passwordResetToken.delete({ where: { id } });
}

function deleteAllByUserId(userId, client = prisma) {
  return client.passwordResetToken.deleteMany({ where: { userId } });
}

module.exports = {
  createPasswordResetToken,
  findByHash,
  deleteById,
  deleteAllByUserId,
};
