// Maps the Prisma enum value stored in the database (EASY/MEDIUM/HARD) to the
// title-case vocabulary the approved public contract uses. Keeping it here
// means the raw database representation never reaches a public response.
const PUBLIC_DIFFICULTY = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' };

// Prisma returns the ProblemTag join rows as [{ tag: { name } }]; the public
// contract exposes a flat array of tag names.
function toTagNames(tags) {
  return tags.map((entry) => entry.tag.name);
}

// Both sanitizers build a brand-new object naming every field explicitly,
// rather than spreading the record and deleting unwanted keys. That way, if
// the repository's select ever grows a field — id, isPublished, timestamps,
// and above all testCases — it cannot reach a public response by accident.
function sanitizePublicProblemSummary(problem) {
  return {
    slug: problem.slug,
    title: problem.title,
    difficulty: PUBLIC_DIFFICULTY[problem.difficulty],
    summary: problem.summary,
    tags: toTagNames(problem.tags),
  };
}

function sanitizePublicProblemDetail(problem) {
  return {
    slug: problem.slug,
    title: problem.title,
    difficulty: PUBLIC_DIFFICULTY[problem.difficulty],
    summary: problem.summary,
    description: problem.description,
    constraints: problem.constraints,
    functionSignature: problem.functionSignature,
    tags: toTagNames(problem.tags),
    // `order` is dropped: it exists to make the repository's ordering
    // deterministic, which it has already applied. The public contract
    // exposes the examples as an ordered array, not their sort keys.
    examples: problem.examples.map((example) => ({
      input: example.input,
      output: example.output,
      explanation: example.explanation,
    })),
  };
}

module.exports = {
  sanitizePublicProblemSummary,
  sanitizePublicProblemDetail,
};
