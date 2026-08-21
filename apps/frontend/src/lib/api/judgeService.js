// Development adapter for the Judge Service.
//
// There is no Judge Service backend yet — this module simulates code
// execution and submission with timed, in-memory mock results so the solve
// workspace can be built against a stable contract now. No code is actually
// compiled or run, and no network requests are made. Every UI surface that
// uses this adapter must make that simulation visible to the user.
export const JUDGE_SERVICE_MODE = 'development-simulation';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
];

export function getLanguages() {
  return LANGUAGES;
}

// Starter code is generated from the problem's signature (owned by
// problemService) formatted for the chosen language — kept here because the
// formatting is an execution-environment concern, not a problem one.
export function getStarterCode(problem, languageId) {
  const signature = problem?.signature || { name: 'solve', params: [] };
  const params = signature.params.join(', ');
  switch (languageId) {
    case 'javascript':
      return `function ${signature.name}(${params}) {\n  // write your solution here\n}`;
    case 'python':
      return `def ${signature.name}(${params}):\n    # write your solution here\n    pass`;
    case 'cpp':
      return `class Solution {\npublic:\n    auto ${signature.name}(${params}) {\n        // write your solution here\n    }\n};`;
    case 'java':
      return `class Solution {\n    public Object ${signature.name}(${params}) {\n        // write your solution here\n    }\n}`;
    default:
      return '// write your solution here';
  }
}

const VERDICT_WEIGHTS = [
  ['Accepted', 0.55],
  ['Wrong Answer', 0.18],
  ['Runtime Error', 0.12],
  ['Time Limit Exceeded', 0.08],
  ['Compilation Error', 0.07],
];

function pickVerdict(code) {
  if (!code || !code.trim()) return 'Compilation Error';
  let roll = Math.random();
  for (const [verdict, weight] of VERDICT_WEIGHTS) {
    if (roll < weight) return verdict;
    roll -= weight;
  }
  return 'Accepted';
}

export function verdictTone(verdict) {
  if (verdict === 'Accepted') return 'success';
  if (verdict === 'Running' || verdict === 'Pending') return 'neutral';
  if (verdict === 'Wrong Answer' || verdict === 'Time Limit Exceeded') return 'warning';
  return 'danger';
}

const SIMULATED_COMPILE_ERROR = 'error: simulated compiler diagnostic — expected \';\' before \'}\' token';
const SIMULATED_RUNTIME_ERROR = 'RuntimeError: simulated fault — index out of range';

// Runs the given code against a single test case (a sample case from the
// problem, or custom stdin). Returns stdout/stderr plus fabricated timing —
// none of it reflects real execution.
export async function runCode({ languageId, code, testCase }) {
  await delay(650 + Math.random() * 400);
  const verdict = pickVerdict(code);
  const executionTimeMs = Math.round(35 + Math.random() * 260);
  const memoryKb = Math.round(14_000 + Math.random() * 9_000);

  if (verdict === 'Compilation Error') {
    return { verdict, stdout: '', stderr: SIMULATED_COMPILE_ERROR, executionTimeMs: 0, memoryKb: 0 };
  }
  if (verdict === 'Runtime Error') {
    return { verdict, stdout: '', stderr: SIMULATED_RUNTIME_ERROR, executionTimeMs, memoryKb };
  }

  const hasExpected = Boolean(testCase?.expectedOutput);
  let stdout;
  if (verdict === 'Accepted') {
    stdout = hasExpected ? testCase.expectedOutput : '(simulated output — program ran without error)';
  } else {
    stdout = hasExpected ? `${testCase.expectedOutput}\n(simulated mismatch for this run)` : '(simulated output — no expected result to compare for custom input)';
  }

  return { verdict, stdout, stderr: '', executionTimeMs, memoryKb };
}

let submissionSeq = 0;
function nextSubmissionId() {
  submissionSeq += 1;
  return `dev-sub-${Date.now()}-${submissionSeq}`;
}

// In-memory only — resets on page reload. Seeded with a little history so
// the Submissions tab has something to show before the user submits anything.
const SUBMISSIONS = [
  { id: 'seed-1', slug: 'two-sum', languageId: 'javascript', verdict: 'Accepted', testCasesPassed: 3, testCasesTotal: 3, executionTimeMs: 68, memoryKb: 17_800, submittedAt: new Date(Date.now() - 2 * 86_400_000).toISOString() },
  { id: 'seed-2', slug: 'two-sum', languageId: 'python', verdict: 'Wrong Answer', testCasesPassed: 1, testCasesTotal: 3, executionTimeMs: 54, memoryKb: 16_200, submittedAt: new Date(Date.now() - 5 * 86_400_000).toISOString() },
  { id: 'seed-3', slug: 'valid-parentheses', languageId: 'java', verdict: 'Accepted', testCasesPassed: 2, testCasesTotal: 2, executionTimeMs: 91, memoryKb: 21_400, submittedAt: new Date(Date.now() - 1 * 86_400_000).toISOString() },
  { id: 'seed-4', slug: 'climbing-stairs', languageId: 'cpp', verdict: 'Time Limit Exceeded', testCasesPassed: 1, testCasesTotal: 2, executionTimeMs: 2_000, memoryKb: 9_600, submittedAt: new Date(Date.now() - 9 * 86_400_000).toISOString() },
];

export async function submitCode({ slug, languageId, code, testCasesTotal = 3 }) {
  await delay(1100 + Math.random() * 700);
  const verdict = pickVerdict(code);
  const executionTimeMs = Math.round(55 + Math.random() * 300);
  const memoryKb = Math.round(15_000 + Math.random() * 10_000);
  const testCasesPassed =
    verdict === 'Accepted' ? testCasesTotal : verdict === 'Compilation Error' || verdict === 'Runtime Error' ? 0 : Math.max(0, Math.floor(Math.random() * testCasesTotal));

  const submission = {
    id: nextSubmissionId(),
    slug,
    languageId,
    verdict,
    testCasesPassed,
    testCasesTotal,
    executionTimeMs,
    memoryKb,
    submittedAt: new Date().toISOString(),
  };
  SUBMISSIONS.unshift(submission);
  return submission;
}

// Omitting slug returns every submission (e.g. for a cross-problem view like
// the Dashboard) — existing per-problem callers are unaffected.
export async function getSubmissionHistory(slug) {
  await delay(150);
  if (!slug) return [...SUBMISSIONS];
  return SUBMISSIONS.filter((submission) => submission.slug === slug);
}

export const judgeService = {
  getLanguages,
  getStarterCode,
  runCode,
  submitCode,
  getSubmissionHistory,
  verdictTone,
};
