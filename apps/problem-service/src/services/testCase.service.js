const prisma = require('../config/prisma');
const testCaseRepository = require('../repositories/testCase.repository');
const problemRepository = require('../repositories/problem.repository');
const ApiError = require('../utils/ApiError');
const { sanitizeAdminTestCase, sanitizeJudgeTestCase } = require('../utils/sanitizeTestCase');

async function loadForProblem(problemId, client) {
  const problem = await problemRepository.existsById(problemId, client);

  if (!problem) {
    throw new ApiError(404, 'Problem not found');
  }

  return testCaseRepository.findManyByProblemId(problemId, client);
}

// Admin management view. A problem with no test cases yet is a valid state
// (nothing is seeded), so this resolves to an empty array rather than a 404 —
// only an unknown problem id is a 404.
async function listForProblem(problemId) {
  const testCases = await loadForProblem(problemId);
  return testCases.map(sanitizeAdminTestCase);
}

// Judge Service view — same rows, narrower shape.
async function listForJudge(problemId) {
  const testCases = await loadForProblem(problemId);
  return testCases.map(sanitizeJudgeTestCase);
}

// Full-set replacement, never a partial edit. The existence check, the delete
// and the insert all run inside one transaction, so a failure at any point
// (including the 404 thrown below, or the problem being deleted concurrently)
// rolls the whole thing back and leaves the previous test cases intact —
// there is no window where a problem has a half-replaced set.
//
// `order` is assigned from array position here rather than taken from the
// payload, matching how M4 assigns example order.
async function replaceForProblem(problemId, testCases) {
  return prisma.$transaction(async (tx) => {
    const problem = await problemRepository.existsById(problemId, tx);

    if (!problem) {
      throw new ApiError(404, 'Problem not found');
    }

    await testCaseRepository.deleteAllByProblemId(problemId, tx);
    await testCaseRepository.createMany(
      testCases.map((testCase, index) => ({
        problemId,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        order: index,
      })),
      tx
    );

    const replaced = await testCaseRepository.findManyByProblemId(problemId, tx);
    return replaced.map(sanitizeAdminTestCase);
  });
}

module.exports = {
  listForProblem,
  listForJudge,
  replaceForProblem,
};
