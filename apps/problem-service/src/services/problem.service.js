const problemRepository = require('../repositories/problem.repository');
const tagRepository = require('../repositories/tag.repository');
const ApiError = require('../utils/ApiError');
const { sanitizePublicProblemSummary, sanitizePublicProblemDetail } = require('../utils/sanitizePublicProblem');
const sanitizePublicTag = require('../utils/sanitizePublicTag');

function toExamplesCreate(examples) {
  return examples.map((example, index) => ({
    input: example.input,
    output: example.output,
    explanation: example.explanation ?? null,
    order: index,
  }));
}

// Deduplicated so a repeated tag name in the payload can never attempt to
// create the same (problemId, tagId) ProblemTag row twice in one write.
function toTagsCreate(tags) {
  return [...new Set(tags)].map((name) => ({
    tag: { connectOrCreate: { where: { name }, create: { name } } },
  }));
}

// --- public catalog ---------------------------------------------------------
//
// These three go through the repository's published-scoped reads, so an
// unpublished problem is invisible here — it never appears in a listing, is
// never counted, and is indistinguishable from a nonexistent slug.

async function listPublished({ search, difficulty, tag, page, pageSize }) {
  const skip = (page - 1) * pageSize;

  const [problems, total] = await Promise.all([
    problemRepository.findManyPublished({ search, difficulty, tag, skip, take: pageSize }),
    problemRepository.countPublished({ search, difficulty, tag }),
  ]);

  return { items: problems.map(sanitizePublicProblemSummary), total, page, pageSize };
}

async function getPublishedBySlug(slug) {
  const problem = await problemRepository.findPublishedBySlug(slug);

  if (!problem) {
    throw new ApiError(404, 'Problem not found');
  }

  return sanitizePublicProblemDetail(problem);
}

async function listPublicTags() {
  const tags = await tagRepository.findAllWithPublishedCounts();
  return tags.map(sanitizePublicTag);
}

// --- admin authoring --------------------------------------------------------

async function createProblem(input) {
  const { examples, tags, isPublished, ...scalarFields } = input;

  try {
    return await problemRepository.create({
      ...scalarFields,
      isPublished: isPublished ?? false,
      examples: { create: toExamplesCreate(examples) },
      tags: { create: toTagsCreate(tags) },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw new ApiError(409, 'Slug is already in use');
    }
    throw err;
  }
}

async function listAdmin({ search, difficulty, tag, page, pageSize }) {
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    problemRepository.findManyAdmin({ search, difficulty, tag, skip, take: pageSize }),
    problemRepository.countAdmin({ search, difficulty, tag }),
  ]);

  return { items, total, page, pageSize };
}

async function getById(id) {
  const problem = await problemRepository.findById(id);

  if (!problem) {
    throw new ApiError(404, 'Problem not found');
  }

  return problem;
}

async function updateProblem(id, input) {
  const { examples, tags, ...scalarFields } = input;
  const data = { ...scalarFields };

  // Only replace examples/tags if the caller actually provided them — PATCH
  // is partial, an omitted field must be left untouched.
  if (examples) {
    data.examples = { deleteMany: {}, create: toExamplesCreate(examples) };
  }
  if (tags) {
    data.tags = { deleteMany: {}, create: toTagsCreate(tags) };
  }

  try {
    return await problemRepository.update(id, data);
  } catch (err) {
    if (err.code === 'P2002') {
      throw new ApiError(409, 'Slug is already in use');
    }
    if (err.code === 'P2025') {
      throw new ApiError(404, 'Problem not found');
    }
    throw err;
  }
}

async function deleteProblem(id) {
  try {
    await problemRepository.deleteById(id);
  } catch (err) {
    if (err.code === 'P2025') {
      throw new ApiError(404, 'Problem not found');
    }
    throw err;
  }
}

module.exports = {
  listPublished,
  getPublishedBySlug,
  listPublicTags,
  createProblem,
  listAdmin,
  getById,
  updateProblem,
  deleteProblem,
};
