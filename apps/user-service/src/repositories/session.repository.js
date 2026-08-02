const prisma = require('../config/prisma');

function createSession(data, client = prisma) {
  return client.session.create({ data });
}

module.exports = {
  createSession,
};
