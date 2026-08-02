const prisma = require('../config/prisma');

function createSession(data, client = prisma) {
  return client.session.create({ data });
}

function findByUserId(userId, client = prisma) {
  return client.session.findMany({ where: { userId } });
}

function findByUserIdAndHash(userId, refreshTokenHash, client = prisma) {
  return client.session.findFirst({ where: { userId, refreshTokenHash } });
}

function updateSession(id, data, client = prisma) {
  return client.session.update({ where: { id }, data });
}

function deleteById(id, client = prisma) {
  return client.session.delete({ where: { id } });
}

function deleteAllByUserId(userId, client = prisma) {
  return client.session.deleteMany({ where: { userId } });
}

module.exports = {
  createSession,
  findByUserId,
  findByUserIdAndHash,
  updateSession,
  deleteById,
  deleteAllByUserId,
};
