// Prisma Client singleton — intended to mirror the User Service's
// src/config/prisma.js exactly:
//
//   const { PrismaClient } = require('@prisma/client');
//   const prisma = new PrismaClient();
//   module.exports = prisma;
//
// It isn't wired up yet. This service's prisma/schema.prisma doesn't exist
// until M2 (schema + migration), and `@prisma/client` cannot construct a
// working client without one — `new PrismaClient()` throws synchronously
// ("@prisma/client did not initialize yet. Please run `prisma generate`")
// until `prisma generate` has run against a real schema. Requiring
// `@prisma/client` here now would either crash on import or sit unused, so
// this module is left as a placeholder and nothing in M1 imports it.
//
// M2 replaces this file's contents with the real singleton shown above.
module.exports = null;
