const prisma = require('../config/prisma');

function createSession(data, client = prisma) {
  return client.session.create({ data });
}

function findByUserId(userId, client = prisma) {
  return client.session.findMany({ where: { userId } });
}

function findById(id, client = prisma) {
  return client.session.findUnique({ where: { id } });
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

// Scoped delete: only removes the row if it both matches the id AND belongs to
// userId, so a caller can never delete another user's session by guessing an id.
// deleteMany (unlike delete) returns a { count } instead of throwing when nothing
// matches, which keeps the caller's ownership check as the single source of truth.
function deleteByIdForUser(id, userId, client = prisma) {
  return client.session.deleteMany({ where: { id, userId } });
}

function deleteAllByUserIdExcept(userId, exceptId, client = prisma) {
  return client.session.deleteMany({ where: { userId, id: { not: exceptId } } });
}

module.exports = {
  createSession,
  findByUserId,
  findById,
  findByUserIdAndHash,
  updateSession,
  deleteById,
  deleteByIdForUser,
  deleteAllByUserId,
  deleteAllByUserIdExcept,
};
