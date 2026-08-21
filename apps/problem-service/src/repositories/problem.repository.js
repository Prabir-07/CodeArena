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

// Richer than the public LIST_SELECT (adds id/isPublished/timestamps, since
// this is a management view, not the public catalog) but still leans on a
// select rather than the full detail shape — an admin list doesn't need
// description/constraints/functionSignature/examples per row.
const ADMIN_LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  difficulty: true,
  summary: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
  tags: { select: { tag: { select: { name: true } } } },
};

function buildPublishedWhere({ search, difficulty, tag } = {}) {
  const where = { isPublished: true };
  if (search) where.title = { contains: search, mode: 'insensitive' };
  if (difficulty) where.difficulty = difficulty;
  if (tag) where.tags = { some: { tag: { name: tag } } };
  return where;
}

// Same filters as buildPublishedWhere, minus the isPublished constraint —
// admin listing must see drafts too.
function buildAdminWhere({ search, difficulty, tag } = {}) {
  const where = {};
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

// Unscoped by publish status — for admin/internal lookups that need to see
// drafts too. Still never includes testCases (see DETAIL_SELECT).
function findById(id, client = prisma) {
  return client.problem.findUnique({ where: { id }, select: DETAIL_SELECT });
}

// Existence check only. Used where a caller needs to tell "no such problem"
// (404) apart from "problem exists but has nothing attached" — fetching the
// full DETAIL_SELECT with its examples and tags would be wasted work.
function existsById(id, client = prisma) {
  return client.problem.findUnique({ where: { id }, select: { id: true } });
}

function findManyAdmin({ search, difficulty, tag, skip = 0, take = 8 } = {}, client = prisma) {
  return client.problem.findMany({
    where: buildAdminWhere({ search, difficulty, tag }),
    select: ADMIN_LIST_SELECT,
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });
}

function countAdmin({ search, difficulty, tag } = {}, client = prisma) {
  return client.problem.count({ where: buildAdminWhere({ search, difficulty, tag }) });
}

// `data` is a fully Prisma-shaped nested-write object built by the service
// layer (scalar fields plus `examples: { create: [...] }` and
// `tags: { create: [...] }`) — this repository does not know or care about
// the business rules behind that shape, only how to pass it through.
function create(data, client = prisma) {
  return client.problem.create({ data, select: DETAIL_SELECT });
}

function update(id, data, client = prisma) {
  return client.problem.update({ where: { id }, data, select: DETAIL_SELECT });
}

// Cascades to ProblemTag/Example/TestCase rows via the FK constraints
// already established in the M2 migration — no manual cleanup needed here.
function deleteById(id, client = prisma) {
  return client.problem.delete({ where: { id } });
}

module.exports = {
  findManyPublished,
  countPublished,
  findPublishedBySlug,
  findById,
  existsById,
  findManyAdmin,
  countAdmin,
  create,
  update,
  deleteById,
};
