// Imports from this service's own generated client (see the `output` path
// in prisma/schema.prisma) rather than the bare `@prisma/client` package
// specifier, so this service's generated code never shares a location with
// (and can never be overwritten by) the User Service's own generated client.
const { PrismaClient } = require('../generated/prisma-client');

const prisma = new PrismaClient();

module.exports = prisma;
