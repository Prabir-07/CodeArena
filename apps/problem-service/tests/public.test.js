const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { startServer } = require('./helpers/server');
const { resetAndSeed, prisma } = require('./helpers/db');

describe('public problem API', () => {
  let api;

  before(async () => {
    await resetAndSeed();
    api = await startServer();
  });

  after(async () => {
    await api.close();
    await prisma.$disconnect();
  });

  describe('GET /health', () => {
    it('reports the service as healthy', async () => {
      const res = await api.get('/health');

      assert.equal(res.status, 200);
      assert.deepEqual(res.body, { success: true, service: 'problem-service', status: 'healthy' });
    });
  });

  describe('GET /problems', () => {
    it('returns only published problems with the public field set', async () => {
      const res = await api.get('/problems');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.total, 3, 'the unpublished fixture must not be counted');

      const slugs = res.body.data.items.map((item) => item.slug);
      assert.ok(!slugs.includes('delta-draft'), 'unpublished problem leaked into the listing');

      assert.deepEqual(
        Object.keys(res.body.data.items[0]).sort(),
        ['difficulty', 'slug', 'summary', 'tags', 'title']
      );
    });

    it('exposes difficulty in the public title-case vocabulary', async () => {
      const res = await api.get('/problems');
      const difficulties = res.body.data.items.map((item) => item.difficulty);

      for (const difficulty of difficulties) {
        assert.ok(['Easy', 'Medium', 'Hard'].includes(difficulty), `unexpected difficulty ${difficulty}`);
      }
    });

    it('flattens tags to an array of names', async () => {
      const res = await api.get('/problems?search=alpha');
      const [problem] = res.body.data.items;

      assert.deepEqual(problem.tags.sort(), ['Array', 'Hash Table']);
    });

    it('paginates without overlap and reports the unfiltered total', async () => {
      const first = await api.get('/problems?page=1&pageSize=2');
      const second = await api.get('/problems?page=2&pageSize=2');

      assert.equal(first.body.data.items.length, 2);
      assert.equal(second.body.data.items.length, 1);
      assert.equal(first.body.data.total, 3);
      assert.equal(second.body.data.total, 3);

      const firstSlugs = first.body.data.items.map((i) => i.slug);
      const secondSlugs = second.body.data.items.map((i) => i.slug);
      assert.equal(firstSlugs.filter((slug) => secondSlugs.includes(slug)).length, 0);
    });

    it('defaults to page 1 with a page size of 8', async () => {
      const res = await api.get('/problems');

      assert.equal(res.body.data.page, 1);
      assert.equal(res.body.data.pageSize, 8);
    });

    it('searches case-insensitively on title', async () => {
      const lower = await api.get('/problems?search=beta');
      const upper = await api.get('/problems?search=BETA');

      assert.equal(lower.body.data.total, 1);
      assert.equal(upper.body.data.total, 1);
      assert.equal(lower.body.data.items[0].slug, 'beta-string');
    });

    it('filters by difficulty', async () => {
      const res = await api.get('/problems?difficulty=Hard');

      assert.equal(res.body.data.total, 1);
      assert.equal(res.body.data.items[0].slug, 'gamma-graph');
    });

    it('filters by tag', async () => {
      const res = await api.get('/problems?tag=Array');
      const slugs = res.body.data.items.map((i) => i.slug).sort();

      assert.deepEqual(slugs, ['alpha-array', 'gamma-graph']);
    });

    it('combines filters', async () => {
      const res = await api.get('/problems?tag=Array&difficulty=Easy');

      assert.equal(res.body.data.total, 1);
      assert.equal(res.body.data.items[0].slug, 'alpha-array');
    });

    it('treats difficulty=all and tag=all as no filter', async () => {
      const res = await api.get('/problems?difficulty=all&tag=all');

      assert.equal(res.body.data.total, 3);
    });

    it('returns an empty page for a tag that matches nothing', async () => {
      const res = await api.get('/problems?tag=NoSuchTag');

      assert.equal(res.status, 200);
      assert.equal(res.body.data.total, 0);
      assert.deepEqual(res.body.data.items, []);
    });

    it('never surfaces a tag that only unpublished problems use', async () => {
      const res = await api.get('/problems?tag=Draft%20Only');

      assert.equal(res.body.data.total, 0);
    });

    for (const [label, query] of [
      ['page below 1', 'page=0'],
      ['non-numeric page', 'page=abc'],
      ['pageSize above the maximum', 'pageSize=999'],
      ['unsupported difficulty', 'difficulty=Extreme'],
      ['unknown query parameter', 'status=all'],
    ]) {
      it(`rejects ${label} with 400`, async () => {
        const res = await api.get(`/problems?${query}`);

        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
        assert.equal(typeof res.body.message, 'string');
      });
    }
  });

  describe('GET /problems/:slug', () => {
    it('returns the full public detail shape', async () => {
      const res = await api.get('/problems/alpha-array');

      assert.equal(res.status, 200);
      assert.deepEqual(
        Object.keys(res.body.data.problem).sort(),
        ['constraints', 'description', 'difficulty', 'examples', 'functionSignature', 'slug', 'summary', 'tags', 'title']
      );
    });

    it('returns examples in order with their public fields only', async () => {
      const res = await api.get('/problems/alpha-array');
      const { examples } = res.body.data.problem;

      assert.equal(examples.length, 2);
      assert.equal(examples[0].input, 'nums = [1,2]');
      assert.equal(examples[1].input, 'nums = [4,5]');
      assert.deepEqual(Object.keys(examples[0]).sort(), ['explanation', 'input', 'output']);
    });

    it('404s for an unknown slug', async () => {
      const res = await api.get('/problems/no-such-problem');

      assert.equal(res.status, 404);
      assert.equal(res.body.message, 'Problem not found');
    });

    it('404s for a malformed slug rather than erroring', async () => {
      const res = await api.get('/problems/NOT__a_slug!!');

      assert.equal(res.status, 404);
      assert.equal(res.body.message, 'Problem not found');
    });

    it('makes an unpublished problem indistinguishable from a missing one', async () => {
      const draft = await api.get('/problems/delta-draft');
      const missing = await api.get('/problems/no-such-problem');

      assert.equal(draft.status, 404);
      assert.deepEqual(draft.body, missing.body);
    });
  });

  describe('GET /tags', () => {
    it('returns tags with published-only counts', async () => {
      const res = await api.get('/tags');

      assert.equal(res.status, 200);

      const byName = Object.fromEntries(res.body.data.tags.map((t) => [t.tag, t.count]));
      assert.equal(byName.Array, 2);
      assert.equal(byName['Hash Table'], 1);
      assert.equal(byName.String, 1);
      assert.equal(byName.Graph, 1);
    });

    it('omits a tag used only by unpublished problems', async () => {
      const res = await api.get('/tags');
      const names = res.body.data.tags.map((t) => t.tag);

      assert.ok(!names.includes('Draft Only'), 'a draft-only tag leaked into the public tag list');
    });

    it('sorts tags by name', async () => {
      const res = await api.get('/tags');
      const names = res.body.data.tags.map((t) => t.tag);

      assert.deepEqual(names, [...names].sort());
    });
  });

  describe('unknown routes', () => {
    it('404s with the standard error shape', async () => {
      const res = await api.get('/definitely-not-a-route');

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
    });
  });
});
