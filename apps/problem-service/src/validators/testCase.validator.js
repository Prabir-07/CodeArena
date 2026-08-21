const { z } = require('zod');

// Deliberately NOT .trim()'d, unlike exampleSchema in problem.validator.js.
// An example is display text, but a test case is compared byte-for-byte by
// the Judge Service — a trailing newline in expectedOutput, or leading
// indentation in input, is significant data. Trimming here would silently
// corrupt the judging contract, so the strings are stored exactly as sent.
//
// express.json()'s default 100kb limit already caps the total request body
// (an oversized one is rejected with 413 before reaching this schema), so
// these are not the only bound. They exist because that byte limit alone
// still allows roughly 2,800 minimal test cases in a single request, and
// each one becomes a database row. Capping the count bounds that
// amplification, and capping field length turns a pathological single value
// into a clear 400 rather than a confusing 413.
//
// The numbers follow the explicit-maximum convention the problem validator
// already uses (title 200, summary 300, description 5000). No seeded or
// existing data is affected: the database currently holds zero test cases.
const MAX_TEST_CASES = 100;
const MAX_FIELD_LENGTH = 10_000;

const testCaseSchema = z
  .object({
    input: z
      .string()
      .min(1, 'Test case input is required')
      .max(MAX_FIELD_LENGTH, `Test case input must be at most ${MAX_FIELD_LENGTH} characters`),
    expectedOutput: z
      .string()
      .min(1, 'Test case expected output is required')
      .max(MAX_FIELD_LENGTH, `Test case expected output must be at most ${MAX_FIELD_LENGTH} characters`),
  })
  .strict();

// `order` is intentionally not accepted in the payload. A test case's
// position is its index in this array — the same rule M4 already applies to
// a problem's examples — which keeps ordering gap-free and makes duplicate
// or conflicting order values impossible by construction rather than by
// validation. `.strict()` means sending `order` is a clear 400 rather than a
// value that gets silently ignored.
//
// The minimum of one case comes from the approved contract ("400 if the
// array is empty"); the maximum is the hardening limit described above.
const replaceTestCasesSchema = z
  .object({
    testCases: z
      .array(testCaseSchema)
      .min(1, 'At least one test case is required')
      .max(MAX_TEST_CASES, `At most ${MAX_TEST_CASES} test cases are allowed`),
  })
  .strict();

module.exports = {
  replaceTestCasesSchema,
};
