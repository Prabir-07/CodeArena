// Both sanitizers build a fresh object naming every field explicitly, the
// same defence used by the public problem sanitizers: if the repository's
// select ever grows a column (timestamps, problemId, ...), it cannot reach a
// response by accident.

// Admin view — includes the row id so an operator can identify a specific
// case in a management UI.
function sanitizeAdminTestCase(testCase) {
  return {
    id: testCase.id,
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    order: testCase.order,
  };
}

// Judge Service view — no database id. The Judge needs the case data and its
// position to run and report per-case results; it has no reason to address a
// Problem Service row by primary key, so it isn't given one.
function sanitizeJudgeTestCase(testCase) {
  return {
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    order: testCase.order,
  };
}

module.exports = {
  sanitizeAdminTestCase,
  sanitizeJudgeTestCase,
};
