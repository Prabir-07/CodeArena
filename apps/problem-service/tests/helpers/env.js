// Must run before anything reads configuration or constructs the Prisma
// client. Both db.js and server.js require this module first, so whichever
// helper a test file pulls in, the environment is already prepared.

process.env.NODE_ENV = 'test';

// Deterministic credentials, set before dotenv runs. dotenv does not override
// variables that are already present, so these win over .env — the suite
// never depends on, or exposes, the developer's real secrets.
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret';
process.env.INTERNAL_SERVICE_SECRET = 'test-internal-service-secret';

require('dotenv').config({ quiet: true });

// The suite truncates tables freely, so it runs against a dedicated Postgres
// schema rather than `public`, where the seeded development data lives. The
// URL is derived from the developer's own DATABASE_URL, which means no new
// container, no docker-compose change and no second credentials file.
const TEST_SCHEMA = 'problem_service_test';

function toTestSchemaUrl(url) {
  if (!url) {
    throw new Error('DATABASE_URL is not set — cannot derive the test database URL.');
  }

  const parsed = new URL(url);
  parsed.searchParams.set('schema', TEST_SCHEMA);
  return parsed.toString();
}

process.env.DATABASE_URL = toTestSchemaUrl(process.env.DATABASE_URL);

// Belt and braces: if the rewrite above ever failed to take effect, the suite
// would wipe the development data on its first reset. Refuse to run instead.
if (!process.env.DATABASE_URL.includes(`schema=${TEST_SCHEMA}`)) {
  throw new Error('Refusing to run: the test DATABASE_URL is not pointing at the isolated test schema.');
}

module.exports = { TEST_SCHEMA };
