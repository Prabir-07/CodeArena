const { describe, it, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');

const { startServer } = require('./helpers/server');
const { resetAndSeed, prisma } = require('./helpers/db');
const { adminToken, userToken, forgedToken } = require('./helpers/auth');

const VALID_PROBLEM = {
  slug: 'new-problem',
  title: 'New Problem',
  difficulty: 'Easy',
  summary: 'A newly authored problem.',
  description: 'Full statement goes here.',
  constraints: ['1 <= n <= 10'],
  tags: ['Array'],
  functionSignature: { name: 'solve', params: [{ name: 'n', type: 'int' }], returnType: 'int' },
  examples: [{ input: 'n = 1', output: '1', explanation: null }],
};

describe('admin problem API', () => {
  let api;
  let admin;
  let ids;

  before(async () => {
    api = await startServer();
    admin = adminToken();
  });

  beforeEach(async () => {
    ids = await resetAndSeed();
  });

  after(async () => {
    await api.close();
    await prisma.$disconnect();
  });

  describe('authentication and authorization', () => {
    const routes = [
      ['GET', '/admin/problems'],
      ['POST', '/admin/problems'],
      ['GET', '/admin/problems/some-id'],
      ['PATCH', '/admin/problems/some-id'],
      ['DELETE', '/admin/problems/some-id'],
    ];

    for (const [method, route] of routes) {
      it(`${method} ${route} requires a token`, async () => {
        const res = await api.request(method, route, { body: {} });

        assert.equal(res.status, 401);
        assert.equal(res.body.message, 'Unauthorized');
      });

      it(`${method} ${route} rejects a non-admin token`, async () => {
        const res = await api.request(method, route, { token: userToken(), body: {} });

        assert.equal(res.status, 403);
        assert.equal(res.body.message, 'Forbidden');
      });
    }

    it('rejects a token signed with the wrong secret', async () => {
      const res = await api.get('/admin/problems', { token: forgedToken() });

      assert.equal(res.status, 401, 'a forged admin token must not be accepted');
    });

    it('rejects a malformed bearer token', async () => {
      const res = await api.get('/admin/problems', { token: 'not.a.jwt' });

      assert.equal(res.status, 401);
    });
  });

  describe('GET /admin/problems', () => {
    it('includes unpublished problems, unlike the public listing', async () => {
      const res = await api.get('/admin/problems', { token: admin });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.total, 4);

      const slugs = res.body.data.items.map((i) => i.slug);
      assert.ok(slugs.includes('delta-draft'));
    });

    it('exposes management fields the public listing hides', async () => {
      const res = await api.get('/admin/problems', { token: admin });
      const keys = Object.keys(res.body.data.items[0]);

      for (const field of ['id', 'isPublished', 'createdAt', 'updatedAt']) {
        assert.ok(keys.includes(field), `admin listing should expose ${field}`);
      }
    });

    it('supports the same filters as the public listing', async () => {
      const res = await api.get('/admin/problems?difficulty=Easy', { token: admin });
      const slugs = res.body.data.items.map((i) => i.slug).sort();

      assert.deepEqual(slugs, ['alpha-array', 'delta-draft']);
    });

    it('rejects unknown query parameters', async () => {
      const res = await api.get('/admin/problems?bogus=1', { token: admin });

      assert.equal(res.status, 400);
    });
  });

  describe('POST /admin/problems', () => {
    it('creates a problem as an unpublished draft by default', async () => {
      const res = await api.post('/admin/problems', { token: admin, body: VALID_PROBLEM });

      assert.equal(res.status, 201);
      assert.equal(res.body.message, 'Problem created');
      assert.equal(res.body.data.problem.slug, 'new-problem');
      assert.equal(res.body.data.problem.isPublished, false, 'new problems must not be published implicitly');
    });

    it('does not expose a new draft through the public API', async () => {
      await api.post('/admin/problems', { token: admin, body: VALID_PROBLEM });
      const res = await api.get('/problems/new-problem');

      assert.equal(res.status, 404);
    });

    it('associates tags, creating them when they do not exist', async () => {
      const res = await api.post('/admin/problems', {
        token: admin,
        body: { ...VALID_PROBLEM, tags: ['Array', 'Brand New Tag'] },
      });

      const names = res.body.data.problem.tags.map((t) => t.tag.name).sort();
      assert.deepEqual(names, ['Array', 'Brand New Tag']);
    });

    it('rejects a duplicate slug with 409', async () => {
      const res = await api.post('/admin/problems', {
        token: admin,
        body: { ...VALID_PROBLEM, slug: 'alpha-array' },
      });

      assert.equal(res.status, 409);
      assert.equal(res.body.message, 'Slug is already in use');
    });

    for (const [label, patch] of [
      ['a missing required field', { description: undefined }],
      ['an invalid difficulty', { difficulty: 'Extreme' }],
      ['a non-kebab-case slug', { slug: 'Not_A_Slug' }],
      ['an unsupported signature type', { functionSignature: { name: 'f', params: [{ name: 'x', type: 'float' }], returnType: null } }],
      ['an empty tag name', { tags: [''] }],
      ['an unrecognized top-level field', { role: 'ADMIN' }],
    ]) {
      it(`rejects ${label} with 400`, async () => {
        const body = { ...VALID_PROBLEM, ...patch };
        if (patch.description === undefined && 'description' in patch) delete body.description;

        const res = await api.post('/admin/problems', { token: admin, body });

        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
      });
    }
  });

  describe('GET /admin/problems/:id', () => {
    it('returns a problem by id, including drafts', async () => {
      const res = await api.get(`/admin/problems/${ids['delta-draft']}`, { token: admin });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.problem.slug, 'delta-draft');
      assert.equal(res.body.data.problem.isPublished, false);
    });

    it('404s for an unknown id', async () => {
      const res = await api.get('/admin/problems/00000000-0000-0000-0000-000000000000', { token: admin });

      assert.equal(res.status, 404);
      assert.equal(res.body.message, 'Problem not found');
    });

    it('404s for a malformed id rather than erroring', async () => {
      const res = await api.get('/admin/problems/not-a-uuid', { token: admin });

      assert.equal(res.status, 404);
    });
  });

  describe('PATCH /admin/problems/:id', () => {
    it('updates only the fields provided', async () => {
      const res = await api.patch(`/admin/problems/${ids['alpha-array']}`, {
        token: admin,
        body: { title: 'Renamed Alpha' },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.problem.title, 'Renamed Alpha');
      assert.equal(res.body.data.problem.summary, 'An easy array problem.', 'untouched fields must be preserved');
    });

    it('can publish a draft, making it publicly visible', async () => {
      await api.patch(`/admin/problems/${ids['delta-draft']}`, { token: admin, body: { isPublished: true } });
      const res = await api.get('/problems/delta-draft');

      assert.equal(res.status, 200);
    });

    it('replaces tags wholesale when tags are supplied', async () => {
      const res = await api.patch(`/admin/problems/${ids['alpha-array']}`, {
        token: admin,
        body: { tags: ['Graph'] },
      });

      const names = res.body.data.problem.tags.map((t) => t.tag.name);
      assert.deepEqual(names, ['Graph']);
    });

    it('rejects an empty payload with 400', async () => {
      const res = await api.patch(`/admin/problems/${ids['alpha-array']}`, { token: admin, body: {} });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /At least one field must be provided/);
    });

    it('rejects an unrecognized field with 400', async () => {
      const res = await api.patch(`/admin/problems/${ids['alpha-array']}`, {
        token: admin,
        body: { isAdmin: true },
      });

      assert.equal(res.status, 400);
    });

    it('rejects a slug that collides with another problem', async () => {
      const res = await api.patch(`/admin/problems/${ids['alpha-array']}`, {
        token: admin,
        body: { slug: 'beta-string' },
      });

      assert.equal(res.status, 409);
    });

    it('404s for an unknown id', async () => {
      const res = await api.patch('/admin/problems/00000000-0000-0000-0000-000000000000', {
        token: admin,
        body: { title: 'x' },
      });

      assert.equal(res.status, 404);
    });
  });

  describe('DELETE /admin/problems/:id', () => {
    it('deletes a problem and its children', async () => {
      const id = ids['alpha-array'];
      const res = await api.delete(`/admin/problems/${id}`, { token: admin });

      assert.equal(res.status, 200);
      assert.equal(await prisma.problem.count({ where: { id } }), 0);
      assert.equal(await prisma.example.count({ where: { problemId: id } }), 0, 'examples must cascade');
      assert.equal(await prisma.problemTag.count({ where: { problemId: id } }), 0, 'tag links must cascade');
    });

    it('404s when deleting the same problem twice', async () => {
      const id = ids['beta-string'];
      await api.delete(`/admin/problems/${id}`, { token: admin });
      const res = await api.delete(`/admin/problems/${id}`, { token: admin });

      assert.equal(res.status, 404);
    });
  });
});
