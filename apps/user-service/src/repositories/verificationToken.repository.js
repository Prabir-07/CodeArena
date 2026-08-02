const prisma = require('../config/prisma');

function createVerificationToken(data, client = prisma) {
  return client.verificationToken.create({ data });
}

function findByHash(tokenHash, client = prisma) {
  return client.verificationToken.findFirst({ where: { tokenHash } });
}

function deleteById(id, client = prisma) {
  return client.verificationToken.delete({ where: { id } });
}

function deleteAllByUserId(userId, client = prisma) {
  return client.verificationToken.deleteMany({ where: { userId } });
}

module.exports = {
  createVerificationToken,
  findByHash,
  deleteById,
  deleteAllByUserId,
};
