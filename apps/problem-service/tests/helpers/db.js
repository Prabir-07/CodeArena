const { TEST_SCHEMA } = require('./env');

const { execFileSync } = require('node:child_process');
const path = require('node:path');
const prisma = require('../../src/config/prisma');

const SERVICE_ROOT = path.join(__dirname, '..', '..');

const TABLES = ['test_cases', 'examples', 'problem_tags', 'problems', 'tags'];

let prepared = false;

// Spawning `npx prisma migrate deploy` costs several seconds, and node --test
// gives each test file its own process, so paying it every time is wasteful.
// The schema persists between runs, so probe for it first and only migrate
// when it is genuinely absent (a fresh clone, or after someone drops it).
async function ensureSchema() {
  if (prepared) return;

  try {
    await prisma.$queryRawUnsafe(`SELECT 1 FROM "${TEST_SCHEMA}"."problems" LIMIT 1`);
  } catch {
    execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: SERVICE_ROOT,
      env: process.env,
      stdio: 'ignore',
      shell: true,
    });
  }

  prepared = true;
}

async function reset() {
  await ensureSchema();

  // One TRUNCATE rather than five deleteMany round trips — this runs before
  // every test, so the difference is the bulk of the suite's runtime.
  const targets = TABLES.map((table) => `"${TEST_SCHEMA}"."${table}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${targets} RESTART IDENTITY CASCADE`);
}

function buildProblem({ slug, title, difficulty, summary, tags, isPublished, examples }) {
  return {
    slug,
    title,
    difficulty,
    summary,
    description: `Description for ${title}.\n\nSecond paragraph.`,
    constraints: [`1 <= n <= 100 for ${slug}`],
    functionSignature: { name: 'solve', params: [{ name: 'n', type: 'int' }], returnType: 'int' },
    isPublished,
    examples: {
      create: examples.map((example, index) => ({ ...example, order: index })),
    },
    tags: {
      create: tags.map((name) => ({ tag: { connectOrCreate: { where: { name }, create: { name } } } })),
    },
  };
}

// A deliberately small, fully-known fixture set. `delta-draft` is unpublished
// and is the only problem carrying the `Draft Only` tag, so it covers both
// "unpublished problems are invisible" and "a tag used only by drafts must not
// appear in the public tag list".
const FIXTURES = [
  {
    slug: 'alpha-array',
    title: 'Alpha Array',
    difficulty: 'EASY',
    summary: 'An easy array problem.',
    tags: ['Array', 'Hash Table'],
    isPublished: true,
    examples: [
      { input: 'nums = [1,2]', output: '3', explanation: 'One plus two.' },
      { input: 'nums = [4,5]', output: '9', explanation: null },
    ],
  },
  {
    slug: 'beta-string',
    title: 'Beta String',
    difficulty: 'MEDIUM',
    summary: 'A medium string problem.',
    tags: ['String'],
    isPublished: true,
    examples: [{ input: 's = "ab"', output: '2', explanation: null }],
  },
  {
    slug: 'gamma-graph',
    title: 'Gamma Graph',
    difficulty: 'HARD',
    summary: 'A hard graph problem.',
    tags: ['Graph', 'Array'],
    isPublished: true,
    examples: [{ input: 'n = 3', output: 'true', explanation: null }],
  },
  {
    slug: 'delta-draft',
    title: 'Delta Draft',
    difficulty: 'EASY',
    summary: 'An unpublished draft problem.',
    tags: ['Draft Only'],
    isPublished: false,
    examples: [{ input: 'x = 1', output: '1', explanation: null }],
  },
];

// Returns a slug -> problem-id map so tests can address a specific fixture
// without hardcoding generated ids.
async function seedFixtures() {
  const ids = {};

  for (const fixture of FIXTURES) {
    // eslint-disable-next-line no-await-in-loop
    const created = await prisma.problem.create({ data: buildProblem(fixture), select: { id: true, slug: true } });
    ids[created.slug] = created.id;
  }

  return ids;
}

async function resetAndSeed() {
  await reset();
  return seedFixtures();
}

module.exports = {
  prisma,
  reset,
  seedFixtures,
  resetAndSeed,
};
