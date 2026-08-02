const prisma = require('../config/prisma');

function findById(id, client = prisma) {
  return client.user.findUnique({ where: { id } });
}

function findByEmail(email, client = prisma) {
  return client.user.findUnique({ where: { email } });
}

function findByUsername(username, client = prisma) {
  return client.user.findUnique({ where: { username } });
}

function createUser(data, client = prisma) {
  return client.user.create({ data });
}

function updateUser(id, data, client = prisma) {
  return client.user.update({ where: { id }, data });
}

module.exports = {
  findById,
  findByEmail,
  findByUsername,
  createUser,
  updateUser,
};
