const prisma = require('../config/prisma');

function findByEmail(email, client = prisma) {
  return client.user.findUnique({ where: { email } });
}

function findByUsername(username, client = prisma) {
  return client.user.findUnique({ where: { username } });
}

function createUser(data, client = prisma) {
  return client.user.create({ data });
}

module.exports = {
  findByEmail,
  findByUsername,
  createUser,
};
