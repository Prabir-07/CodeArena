const prisma = require('../config/prisma');

function createPasswordResetToken(data, client = prisma) {
  return client.passwordResetToken.create({ data });
}

function findByHash(tokenHash, client = prisma) {
  return client.passwordResetToken.findFirst({ where: { tokenHash } });
}

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
