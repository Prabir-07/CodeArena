// HTTP adapter for the real Problem Service (apps/problem-service).
//
// These three endpoints are public and require no authentication, so no
// credentials are sent (see problemRequest in lib/api/client.js).
//
// The Problem Service deliberately does not own submission-derived data —
// acceptance rate, solved/submission counts, or a per-user solved/attempted
// status. Those are not requested here and are not synthesised: there is no
// authoritative source for them until a Judge Service exists.
import { ApiError, problemRequest } from './client';

export class ProblemNotFoundError extends Error {
  constructor(slug) {
    super(`Problem "${slug}" was not found.`);
    this.slug = slug;
  }
}

// The list query schema is strict: an unknown parameter is a 400, and "all"
// is the backend's own default for difficulty/tag. Omitting them entirely is
// equivalent and keeps the URL clean.
function toQueryString({ search, difficulty, tag, page, pageSize } = {}) {
  const params = new URLSearchParams();

  if (search?.trim()) params.set('search', search.trim());
  if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty);
  if (tag && tag !== 'all') params.set('tag', tag);
  if (page) params.set('page', String(page));
  if (pageSize) params.set('pageSize', String(pageSize));

  const query = params.toString();
  return query ? `?${query}` : '';
}

// Resolves to { items, total, page, pageSize }, where each item is
// { slug, title, difficulty, summary, tags }.
export async function listProblems(filters = {}) {
  const body = await problemRequest(`/problems${toQueryString(filters)}`);
  return body.data;
}

// Resolves to the full problem: slug, title, difficulty, summary,
// description, constraints, functionSignature, tags, examples.
export async function getProblem(slug) {
  try {
    const body = await problemRequest(`/problems/${encodeURIComponent(slug)}`);
    return body.data.problem;
  } catch (error) {
    // An unpublished problem is deliberately indistinguishable from a missing
    // one, so both arrive here as a 404.
    if (error instanceof ApiError && error.status === 404) {
      throw new ProblemNotFoundError(slug);
    }
    throw error;
  }
}

// Resolves to [{ tag, count }], counted over published problems only.
export async function getProblemTags() {
  const body = await problemRequest('/tags');
  return body.data.tags;
}

export const problemService = {
  listProblems,
  getProblem,
  getProblemTags,
};
