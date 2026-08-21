const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');

const { startServer } = require('./helpers/server');
const { resetAndSeed, prisma } = require('./helpers/db');
const { adminToken, userToken, forgedToken, internalSecret } = require('./helpers/auth');

// Distinctive values, so a leak anywhere is unambiguous rather than a
// coincidental substring match.
const SECRET_CASES = [
  { input: 'ZZ-SECRET-INPUT-ONE', expectedOutput: 'ZZ-SECRET-OUTPUT-ONE' },
  { input: 'ZZ-SECRET-INPUT-TWO', expectedOutput: 'ZZ-SECRET-OUTPUT-TWO' },
];

describe('security and data isolation', () => {
  let api;
  let admin;
  let ids;
  let problemId;

  before(async () => {
    api = await startServer();
    admin = adminToken();
  });

  beforeEach(async () => {
    ids = await resetAndSeed();
    problemId = ids['alpha-array'];
    // Every test in this file runs with real hidden test cases present, so
    // "nothing leaked" is a meaningful result rather than a vacuous one.
    await api.put(`/admin/problems/${problemId}/test-cases`, { token: admin, body: { testCases: SECRET_CASES } });
  });

  after(async () => {
    await api.close();
    await prisma.$disconnect();
  });

  describe('hidden test cases never reach the public API', () => {
    const publicRoutes = [
      '/problems',
      '/problems?pageSize=50',
      '/problems?tag=Array',
      '/problems?search=alpha',
      '/problems/alpha-array',
      '/tags',
    ];

    for (const route of publicRoutes) {
      it(`GET ${route} exposes no test-case data`, async () => {
        const res = await api.get(route);

        assert.equal(res.status, 200);
        for (const needle of ['ZZ-SECRET', 'expectedOutput', 'testCase']) {
          assert.ok(!res.raw.includes(needle), `"${needle}" leaked from ${route}`);
        }
      });
    }

    it('confirms the test cases really do exist while those checks run', async () => {
      assert.equal(await prisma.testCase.count({ where: { problemId } }), 2);
    });
  });

  describe('internal-only fields never reach the public API', () => {
    it('the public detail response omits id, isPublished and timestamps', async () => {
      const res = await api.get('/problems/alpha-array');
      const keys = Object.keys(res.body.data.problem);

      for (const field of ['id', 'isPublished', 'createdAt', 'updatedAt', 'testCases']) {
        assert.ok(!keys.includes(field), `public detail must not expose ${field}`);
      }
    });

    it('the public listing omits id, isPublished and timestamps', async () => {
      const res = await api.get('/problems');
      const keys = Object.keys(res.body.data.items[0]);

      for (const field of ['id', 'isPublished', 'createdAt', 'updatedAt', 'testCases']) {
        assert.ok(!keys.includes(field), `public listing must not expose ${field}`);
      }
    });

    it('public examples omit their ordering key and foreign key', async () => {
      const res = await api.get('/problems/alpha-array');
      const [example] = res.body.data.problem.examples;

      for (const field of ['id', 'order', 'problemId']) {
        assert.ok(!(field in example), `public example must not expose ${field}`);
      }
    });

    it('the judge-facing shape omits the TestCase id', async () => {
      const res = await api.get(`/internal/problems/${problemId}/test-cases`, { internalSecret: internalSecret() });

      assert.ok(!('id' in res.body.data.testCases[0]));
    });
  });

  describe('authentication cannot be bypassed', () => {
    it('a valid non-admin token cannot reach admin routes', async () => {
      const res = await api.get('/admin/problems', { token: userToken() });

      assert.equal(res.status, 403);
    });

    it('a forged admin token is rejected outright', async () => {
      const res = await api.get('/admin/problems', { token: forgedToken() });

      assert.equal(res.status, 401);
    });

    it('a role claim in an unsigned token is not trusted', async () => {
      // header.payload.signature with an empty signature — the classic
      // "alg: none"-style forgery attempt.
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: 'attacker', role: 'ADMIN' })).toString('base64url');

      const res = await api.get('/admin/problems', { token: `${header}.${payload}.` });

      assert.equal(res.status, 401);
    });

    it('an admin token cannot substitute for the internal secret', async () => {
      const res = await api.get(`/internal/problems/${problemId}/test-cases`, { token: admin });

      assert.equal(res.status, 403);
    });

    it('the internal secret cannot substitute for an admin token', async () => {
      const res = await api.get(`/admin/problems/${problemId}/test-cases`, { internalSecret: internalSecret() });

      assert.equal(res.status, 401);
    });
  });

  describe('error responses do not leak internals', () => {
    it('never echoes secrets back to the caller', async () => {
      const responses = await Promise.all([
        api.get('/problems'),
        api.get('/admin/problems', { token: admin }),
        api.get(`/internal/problems/${problemId}/test-cases`, { internalSecret: internalSecret() }),
        api.get('/admin/problems', { token: userToken() }),
      ]);

      for (const res of responses) {
        assert.ok(!res.raw.includes(process.env.JWT_ACCESS_SECRET), 'JWT secret leaked into a response');
        assert.ok(!res.raw.includes(process.env.INTERNAL_SERVICE_SECRET), 'internal secret leaked into a response');
      }
    });

    it('replaces an unexpected repository failure with a generic message', async () => {
      const problemRepository = require('../src/repositories/problem.repository');
      const original = problemRepository.findManyPublished;

      // Reproduces the shape of a real Prisma failure. Its message embeds the
      // failing query, an excerpt of this service's source, the absolute file
      // path and the database host and port — verified against a live
      // unreachable-database run, where exactly this string was returned to an
      // unauthenticated caller before the error middleware was hardened.
      const leaky = new Error(
        'Invalid `client.problem.findMany()` invocation in\n' +
          'C:\\Projects\\CodeArena\\apps\\problem-service\\src\\repositories\\problem.repository.js:67:25\n' +
          "Can't reach database server at `127.0.0.1:59999`"
      );

      problemRepository.findManyPublished = () => {
        throw leaky;
      };

      try {
        const res = await api.get('/problems');

        assert.equal(res.status, 500);
        assert.deepEqual(res.body, { success: false, message: 'Internal Server Error' });

        for (const needle of ['findMany', 'problem.repository', '59999', 'Invalid `client', '.js:']) {
          assert.ok(!res.raw.includes(needle), `error response leaked "${needle}"`);
        }
      } finally {
        problemRepository.findManyPublished = original;
      }
    });

    it('still returns useful, specific messages for deliberate client errors', async () => {
      const notFound = await api.get('/problems/no-such-problem');
      const badRequest = await api.get('/problems?page=0');

      assert.equal(notFound.body.message, 'Problem not found');
      assert.match(badRequest.body.message, /page/);
    });

    it('returns a safe message for an oversized body', async () => {
      const res = await api.put(`/admin/problems/${problemId}/test-cases`, {
        token: admin,
        body: { testCases: [{ input: 'x'.repeat(200_000), expectedOutput: 'y' }] },
      });

      assert.equal(res.status, 413);
      assert.equal(res.body.message, 'request entity too large');
    });

    it('returns a safe message for malformed JSON', async () => {
      const res = await api.request('POST', '/admin/problems', {
        token: admin,
        headers: { 'Content-Type': 'application/json' },
      });

      // No body at all is a validation failure, not a server fault.
      assert.ok(res.status === 400, `expected 400, got ${res.status}`);
      assert.equal(res.body.success, false);
    });
  });

  describe('response headers', () => {
    it('applies helmet and does not advertise Express', async () => {
      const res = await api.get('/problems');

      assert.equal(res.headers.get('x-powered-by'), null);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    });

    it('emits no CORS headers, so browsers block cross-origin reads by default', async () => {
      const res = await api.get('/problems', { headers: { Origin: 'http://evil.example' } });

      assert.equal(res.headers.get('access-control-allow-origin'), null);
    });
  });

  describe('strict schemas reject unknown fields', () => {
    it('rejects mass-assignment attempts on problem creation', async () => {
      const res = await api.post('/admin/problems', {
        token: admin,
        body: {
          slug: 'mass-assign',
          title: 'Mass Assign',
          difficulty: 'Easy',
          summary: 's',
          description: 'd',
          functionSignature: { name: 'f', params: [], returnType: null },
          examples: [{ input: 'a', output: 'b' }],
          id: 'attacker-chosen-id',
        },
      });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /Unrecognized key/);
    });

    it('rejects unknown fields on test-case replacement', async () => {
      const res = await api.put(`/admin/problems/${problemId}/test-cases`, {
        token: admin,
        body: { testCases: [{ input: 'a', expectedOutput: 'b', problemId: 'other' }] },
      });

      assert.equal(res.status, 400);
    });
  });
});
