const prisma = require('../config/prisma');

// Only tags attached to at least one published problem, with a count scoped
// the same way — a tag used only by drafts should not appear in the public
// filter list at all, and its count must never include draft problems.
function findAllWithPublishedCounts(client = prisma) {
  return client.tag.findMany({
    where: { problems: { some: { problem: { isPublished: true } } } },
    select: {
      name: true,
      _count: { select: { problems: { where: { problem: { isPublished: true } } } } },
    },
    orderBy: { name: 'asc' },
  });
}

module.exports = {
  findAllWithPublishedCounts,
};
