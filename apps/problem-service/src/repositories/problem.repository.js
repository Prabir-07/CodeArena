const prisma = require('../config/prisma');

// Shared by both list and detail reads. Never includes `testCases` — hidden
// test cases are only ever reachable through their own dedicated repository
// method (added when the admin/internal test-case APIs are built), so there
// is exactly one code path in this service that can return them.
const DETAIL_SELECT = {
  id: true,
  slug: true,
  title: true,
  difficulty: true,
  summary: true,
  description: true,
  constraints: true,
  functionSignature: true,
  isPublished: true,
  tags: { select: { tag: { select: { name: true } } } },
  examples: {
    orderBy: { order: 'asc' },
    select: { input: true, output: true, explanation: true, order: true },
  },
};

const LIST_SELECT = {
  slug: true,
  title: true,
  difficulty: true,
  summary: true,
  tags: { select: { tag: { select: { name: true } } } },
};

function buildPublishedWhere({ search, difficulty, tag } = {}) {
  const where = { isPublished: true };
  if (search) where.title = { contains: search, mode: 'insensitive' };
  if (difficulty) where.difficulty = difficulty;
  if (tag) where.tags = { some: { tag: { name: tag } } };
  return where;
}

function findManyPublished({ search, difficulty, tag, skip = 0, take = 8 } = {}, client = prisma) {
  return client.problem.findMany({
    where: buildPublishedWhere({ search, difficulty, tag }),
    select: LIST_SELECT,
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });
}

function countPublished({ search, difficulty, tag } = {}, client = prisma) {
  return client.problem.count({ where: buildPublishedWhere({ search, difficulty, tag }) });
}

// findFirst (not findUnique) because a draft problem must be indistinguishable
// from a nonexistent one to this lookup — findUnique can't combine the unique
// `slug` field with the additional `isPublished` condition in one query.
function findPublishedBySlug(slug, client = prisma) {
  return client.problem.findFirst({
    where: { slug, isPublished: true },
    select: DETAIL_SELECT,
  });
}

// Unscoped by publish status — for future admin/internal lookups that need
// to see drafts too. Still never includes testCases (see DETAIL_SELECT).
function findById(id, client = prisma) {
  return client.problem.findUnique({ where: { id }, select: DETAIL_SELECT });
}

module.exports = {
  findManyPublished,
  countPublished,
  findPublishedBySlug,
  findById,
};
