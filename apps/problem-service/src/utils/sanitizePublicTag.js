// Prisma returns { name, _count: { problems } }; the approved public contract
// (and the frontend's topic filter) uses { tag, count }. The count is already
// scoped to published problems by the repository's query.
function sanitizePublicTag(tag) {
  return {
    tag: tag.name,
    count: tag._count.problems,
  };
}

module.exports = sanitizePublicTag;
