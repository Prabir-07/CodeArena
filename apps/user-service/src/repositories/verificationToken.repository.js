const prisma = require('../config/prisma');

function createVerificationToken(data, client = prisma) {
  return client.verificationToken.create({ data });
}

module.exports = {
  createVerificationToken,
};
