const prisma = require('../config/prisma');

// Every function here is scoped by problemId. There is deliberately no
// "find all test cases" method: a caller must always name the problem whose
// hidden data it is asking for, so a bug can never fan out into the whole
// table.
const TEST_CASE_SELECT = {
  id: true,
  input: true,
  expectedOutput: true,
  order: true,
};

function findManyByProblemId(problemId, client = prisma) {
  return client.testCase.findMany({
    where: { problemId },
    select: TEST_CASE_SELECT,
    orderBy: { order: 'asc' },
  });
}

function deleteAllByProblemId(problemId, client = prisma) {
  return client.testCase.deleteMany({ where: { problemId } });
}

// `data` is the fully-shaped row array (problemId/order already resolved by
// the service) — this layer does no business logic, per the established
// repository convention.
function createMany(data, client = prisma) {
  return client.testCase.createMany({ data });
}

module.exports = {
  findManyByProblemId,
  deleteAllByProblemId,
  createMany,
};
