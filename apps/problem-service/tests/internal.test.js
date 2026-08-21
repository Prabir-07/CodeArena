const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');

const { startServer } = require('./helpers/server');
const { resetAndSeed, prisma } = require('./helpers/db');
const { adminToken, userToken, internalSecret } = require('./helpers/auth');

const TWO_CASES = [
  { input: 'judge-in-1', expectedOutput: 'judge-out-1' },
  { input: 'judge-in-2', expectedOutput: 'judge-out-2' },
];

describe('internal judge API', () => {
  let api;
  let admin;
  let secret;
  let ids;
  let problemId;

  before(async () => {
    api = await startServer();
    admin = adminToken();
    secret = internalSecret();
  });

  beforeEach(async () => {
    ids = await resetAndSeed();
    problemId = ids['alpha-array'];
  });

  after(async () => {
    await api.close();
    await prisma.$disconnect();
  });

  describe('authentication', () => {
    it('rejects a request with no secret', async () => {
      const res = await api.get(`/internal/problems/${problemId}/test-cases`);

      assert.equal(res.status, 403);
      assert.equal(res.body.message, 'Forbidden');
    });

    it('rejects an incorrect secret', async () => {
      const res = await api.get(`/internal/problems/${problemId}/test-cases`, { internalSecret: 'wrong-secret' });

      assert.equal(res.status, 403);
    });

    it('rejects a wrong secret of the correct length', async () => {
      const res = await api.get(`/internal/problems/${problemId}/test-cases`, {
        internalSecret: 'x'.repeat(secret.length),
      });

      assert.equal(res.status, 403);
    });

    it('rejects an empty secret', async () => {
      const res = await api.get(`/internal/problems/${problemId}/test-cases`, { internalSecret: '' });

      assert.equal(res.status, 403);
    });

    it('gives an identical response whether the secret is missing or wrong', async () => {
      const missing = await api.get(`/internal/problems/${problemId}/test-cases`);
      const wrong = await api.get(`/internal/problems/${problemId}/test-cases`, { internalSecret: 'wrong' });

      assert.equal(missing.status, wrong.status);
      assert.deepEqual(missing.body, wrong.body);
    });

    it('accepts the correct secret', async () => {
      const res = await api.get(`/internal/problems/${problemId}/test-cases`, { internalSecret: secret });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    it('does not reveal whether an internal route exists without the secret', async () => {
      const withoutSecret = await api.get('/internal/definitely-not-a-route');
      const withSecret = await api.get('/internal/definitely-not-a-route', { internalSecret: secret });

      assert.equal(withoutSecret.status, 403, 'route existence must not be probeable');
      assert.equal(withSecret.status, 404);
    });
  });

  describe('credential separation', () => {
    it('does not accept an admin JWT', async () => {
      const res = await api.get(`/internal/problems/${problemId}/test-cases`, { token: admin });

      assert.equal(res.status, 403, 'an admin JWT must not reach hidden test cases');
    });

    it('does not accept a user JWT', async () => {
      const res = await api.get(`/internal/problems/${problemId}/test-cases`, { token: userToken() });

      assert.equal(res.status, 403);
    });

    it('the internal secret does not authenticate admin read routes', async () => {
      const res = await api.get(`/admin/problems/${problemId}/test-cases`, { internalSecret: secret });

      assert.equal(res.status, 401);
    });

    it('the internal secret does not authenticate admin write routes', async () => {
      const res = await api.put(`/admin/problems/${problemId}/test-cases`, {
        internalSecret: secret,
        body: { testCases: TWO_CASES },
      });

      assert.equal(res.status, 401);
    });

    it('the internal secret does not authenticate admin problem listing', async () => {
      const res = await api.get('/admin/problems', { internalSecret: secret });

      assert.equal(res.status, 401);
    });
  });

  describe('GET /internal/problems/:id/test-cases', () => {
    it('returns the stored cases in order', async () => {
      await api.put(`/admin/problems/${problemId}/test-cases`, { token: admin, body: { testCases: TWO_CASES } });

      const res = await api.get(`/internal/problems/${problemId}/test-cases`, { internalSecret: secret });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.testCases.length, 2);
      assert.deepEqual(res.body.data.testCases.map((t) => t.order), [0, 1]);
      assert.deepEqual(res.body.data.testCases.map((t) => t.input), ['judge-in-1', 'judge-in-2']);
    });

    it('omits the database id from the judge-facing shape', async () => {
      await api.put(`/admin/problems/${problemId}/test-cases`, { token: admin, body: { testCases: TWO_CASES } });

      const res = await api.get(`/internal/problems/${problemId}/test-cases`, { internalSecret: secret });

      assert.deepEqual(Object.keys(res.body.data.testCases[0]).sort(), ['expectedOutput', 'input', 'order']);
    });

    it('preserves whitespace exactly for the judge', async () => {
      await api.put(`/admin/problems/${problemId}/test-cases`, {
        token: admin,
        body: { testCases: [{ input: '  spaced  ', expectedOutput: 'newline\n' }] },
      });

      const res = await api.get(`/internal/problems/${problemId}/test-cases`, { internalSecret: secret });

      assert.equal(res.body.data.testCases[0].input, '  spaced  ');
      assert.equal(res.body.data.testCases[0].expectedOutput, 'newline\n');
    });

    it('returns an empty list for a problem with no test cases', async () => {
      const res = await api.get(`/internal/problems/${problemId}/test-cases`, { internalSecret: secret });

      assert.equal(res.status, 200);
      assert.deepEqual(res.body.data.testCases, []);
    });

    it('404s for an unknown problem', async () => {
      const res = await api.get('/internal/problems/00000000-0000-0000-0000-000000000000/test-cases', {
        internalSecret: secret,
      });

      assert.equal(res.status, 404);
      assert.equal(res.body.message, 'Problem not found');
    });

    it('404s for a malformed id', async () => {
      const res = await api.get('/internal/problems/not-a-uuid/test-cases', { internalSecret: secret });

      assert.equal(res.status, 404);
    });

    it('serves test cases for an unpublished problem', async () => {
      const draftId = ids['delta-draft'];
      await api.put(`/admin/problems/${draftId}/test-cases`, { token: admin, body: { testCases: TWO_CASES } });

      const res = await api.get(`/internal/problems/${draftId}/test-cases`, { internalSecret: secret });

      assert.equal(res.status, 200, 'the judge is not restricted to published problems');
      assert.equal(res.body.data.testCases.length, 2);
    });
  });
});
