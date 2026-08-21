const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');

const { startServer } = require('./helpers/server');
const { resetAndSeed, prisma } = require('./helpers/db');
const { adminToken, userToken } = require('./helpers/auth');

const TWO_CASES = [
  { input: 'in-one', expectedOutput: 'out-one' },
  { input: 'in-two', expectedOutput: 'out-two' },
];

describe('admin test-case API', () => {
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
  });

  after(async () => {
    await api.close();
    await prisma.$disconnect();
  });

  describe('authentication and authorization', () => {
    it('GET requires a token', async () => {
      const res = await api.get(`/admin/problems/${problemId}/test-cases`);

      assert.equal(res.status, 401);
    });

    it('GET rejects a non-admin token', async () => {
      const res = await api.get(`/admin/problems/${problemId}/test-cases`, { token: userToken() });

      assert.equal(res.status, 403);
    });

    it('PUT requires a token', async () => {
      const res = await api.put(`/admin/problems/${problemId}/test-cases`, { body: { testCases: TWO_CASES } });

      assert.equal(res.status, 401);
    });

    it('PUT rejects a non-admin token', async () => {
      const res = await api.put(`/admin/problems/${problemId}/test-cases`, {
        token: userToken(),
        body: { testCases: TWO_CASES },
      });

      assert.equal(res.status, 403);
    });
  });

  describe('GET /admin/problems/:id/test-cases', () => {
    it('returns an empty list for a problem with none', async () => {
      const res = await api.get(`/admin/problems/${problemId}/test-cases`, { token: admin });

      assert.equal(res.status, 200);
      assert.deepEqual(res.body.data.testCases, []);
    });

    it('distinguishes an unknown problem from one with no test cases', async () => {
      const res = await api.get('/admin/problems/00000000-0000-0000-0000-000000000000/test-cases', { token: admin });

      assert.equal(res.status, 404);
      assert.equal(res.body.message, 'Problem not found');
    });

    it('returns stored cases in order with the admin field set', async () => {
      await api.put(`/admin/problems/${problemId}/test-cases`, { token: admin, body: { testCases: TWO_CASES } });
      const res = await api.get(`/admin/problems/${problemId}/test-cases`, { token: admin });

      assert.equal(res.body.data.testCases.length, 2);
      assert.deepEqual(Object.keys(res.body.data.testCases[0]).sort(), ['expectedOutput', 'id', 'input', 'order']);
      assert.deepEqual(res.body.data.testCases.map((t) => t.order), [0, 1]);
      assert.deepEqual(res.body.data.testCases.map((t) => t.input), ['in-one', 'in-two']);
    });
  });

  describe('PUT /admin/problems/:id/test-cases', () => {
    it('stores a single test case', async () => {
      const res = await api.put(`/admin/problems/${problemId}/test-cases`, {
        token: admin,
        body: { testCases: [{ input: 'solo', expectedOutput: 'result' }] },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.message, 'Test cases replaced');
      assert.equal(res.body.data.testCases.length, 1);
    });

    it('assigns order from array position', async () => {
      const res = await api.put(`/admin/problems/${problemId}/test-cases`, {
        token: admin,
        body: { testCases: [
          { input: 'a', expectedOutput: '1' },
          { input: 'b', expectedOutput: '2' },
          { input: 'c', expectedOutput: '3' },
        ] },
      });

      assert.deepEqual(res.body.data.testCases.map((t) => t.order), [0, 1, 2]);
      assert.deepEqual(res.body.data.testCases.map((t) => t.input), ['a', 'b', 'c']);
    });

    it('replaces the whole set rather than appending', async () => {
      await api.put(`/admin/problems/${problemId}/test-cases`, { token: admin, body: { testCases: TWO_CASES } });

      const res = await api.put(`/admin/problems/${problemId}/test-cases`, {
        token: admin,
        body: { testCases: [{ input: 'only-one-left', expectedOutput: 'x' }] },
      });

      assert.equal(res.body.data.testCases.length, 1);
      assert.equal(await prisma.testCase.count({ where: { problemId } }), 1);
      assert.equal(await prisma.testCase.count({ where: { input: 'in-one' } }), 0, 'previous cases must be gone');
    });

    it('preserves whitespace exactly, since a judge compares byte-for-byte', async () => {
      const res = await api.put(`/admin/problems/${problemId}/test-cases`, {
        token: admin,
        body: { testCases: [{ input: '  padded  ', expectedOutput: 'trailing\n' }] },
      });

      assert.equal(res.body.data.testCases[0].input, '  padded  ');
      assert.equal(res.body.data.testCases[0].expectedOutput, 'trailing\n');
    });

    it('leaves other problems untouched', async () => {
      await api.put(`/admin/problems/${problemId}/test-cases`, { token: admin, body: { testCases: TWO_CASES } });

      assert.equal(await prisma.testCase.count({ where: { problemId: ids['beta-string'] } }), 0);
    });

    it('404s for an unknown problem and writes nothing', async () => {
      const res = await api.put('/admin/problems/00000000-0000-0000-0000-000000000000/test-cases', {
        token: admin,
        body: { testCases: TWO_CASES },
      });

      assert.equal(res.status, 404);
      assert.equal(await prisma.testCase.count(), 0);
    });

    for (const [label, body] of [
      ['an empty array', { testCases: [] }],
      ['a missing testCases field', {}],
      ['a missing expectedOutput', { testCases: [{ input: 'a' }] }],
      ['an empty input string', { testCases: [{ input: '', expectedOutput: 'b' }] }],
      ['a client-supplied order', { testCases: [{ input: 'a', expectedOutput: 'b', order: 5 }] }],
      ['an unrecognized top-level key', { testCases: TWO_CASES, extra: true }],
      ['more than 100 test cases', { testCases: Array.from({ length: 101 }, (_, i) => ({ input: `i${i}`, expectedOutput: `o${i}` })) }],
      ['an over-long input', { testCases: [{ input: 'x'.repeat(10_001), expectedOutput: 'b' }] }],
      ['an over-long expectedOutput', { testCases: [{ input: 'a', expectedOutput: 'x'.repeat(10_001) }] }],
    ]) {
      it(`rejects ${label} with 400`, async () => {
        const res = await api.put(`/admin/problems/${problemId}/test-cases`, { token: admin, body });

        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
      });
    }

    it('accepts exactly the maximum allowed number of test cases', async () => {
      const res = await api.put(`/admin/problems/${problemId}/test-cases`, {
        token: admin,
        body: { testCases: Array.from({ length: 100 }, (_, i) => ({ input: `i${i}`, expectedOutput: `o${i}` })) },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.testCases.length, 100);
    });

    it('rejects an oversized body before validation, with 413', async () => {
      const res = await api.put(`/admin/problems/${problemId}/test-cases`, {
        token: admin,
        body: { testCases: [{ input: 'x'.repeat(200_000), expectedOutput: 'y' }] },
      });

      assert.equal(res.status, 413);
    });

    it('leaves the previous set intact when a replacement is rejected', async () => {
      await api.put(`/admin/problems/${problemId}/test-cases`, { token: admin, body: { testCases: TWO_CASES } });

      await api.put(`/admin/problems/${problemId}/test-cases`, { token: admin, body: { testCases: [] } });

      const stored = await prisma.testCase.findMany({ where: { problemId }, orderBy: { order: 'asc' } });
      assert.deepEqual(stored.map((t) => t.input), ['in-one', 'in-two']);
    });
  });

  describe('cascade', () => {
    it('removes test cases when their problem is deleted', async () => {
      await api.put(`/admin/problems/${problemId}/test-cases`, { token: admin, body: { testCases: TWO_CASES } });
      await api.delete(`/admin/problems/${problemId}`, { token: admin });

      assert.equal(await prisma.testCase.count({ where: { problemId } }), 0);
    });
  });
});
