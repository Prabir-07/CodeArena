const { z } = require('zod');

// Deliberately NOT .trim()'d, unlike exampleSchema in problem.validator.js.
// An example is display text, but a test case is compared byte-for-byte by
// the Judge Service — a trailing newline in expectedOutput, or leading
// indentation in input, is significant data. Trimming here would silently
// corrupt the judging contract, so the strings are stored exactly as sent.
const testCaseSchema = z
  .object({
    input: z.string().min(1, 'Test case input is required'),
    expectedOutput: z.string().min(1, 'Test case expected output is required'),
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
// array is empty"). No maximum is imposed: nothing in the approved
// requirements specifies one, and inventing a limit here would be arbitrary.
const replaceTestCasesSchema = z
  .object({
    testCases: z.array(testCaseSchema).min(1, 'At least one test case is required'),
  })
  .strict();

module.exports = {
  replaceTestCasesSchema,
};
