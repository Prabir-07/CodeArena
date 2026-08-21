# Problem Service API

This document describes every HTTP endpoint the Problem Service currently implements. It reflects the code as it exists today.

All routes are relative to the service's base URL (e.g. `http://localhost:5001`). All request and response bodies are JSON.

**Sections**

- [Authentication](#authentication)
- [A note on response shapes](#a-note-on-response-shapes)
- [What public responses never contain](#what-public-responses-never-contain)
- [Health](#health)
- [A. Public APIs](#a-public-apis)
- [B. Admin APIs](#b-admin-apis)
- [C. Internal Judge API](#c-internal-judge-api)
- [Common response format](#common-response-format)

---

## Authentication

The service has three surfaces with three different credentials, which are **not interchangeable**.

| Surface | Routes | Credential |
|---|---|---|
| Public | `/health`, `/problems`, `/problems/:slug`, `/tags` | None |
| Admin | `/admin/problems/*` | User Service access token **and** `role === "ADMIN"` |
| Internal | `/internal/*` | `X-Internal-Service-Token` header matching `INTERNAL_SERVICE_SECRET` |

**Admin.** The access token is read from an `Authorization: Bearer <token>` header, falling back to the `accessToken` cookie — the same extraction order the User Service uses. It is verified locally with the shared `JWT_ACCESS_SECRET`; there is no callback to the User Service. A missing or invalid token is `401`; a valid token whose `role` is not `ADMIN` is `403`.

**Internal.** The secret is compared with `crypto.timingSafeEqual`. Verification **fails closed**: if `INTERNAL_SERVICE_SECRET` is unset, every request is rejected, so a missing environment variable can never mean "no credential required". Every failure mode — missing header, wrong secret, unconfigured server — returns an identical `403 Forbidden`, so a caller cannot tell them apart. The check runs before routing, so an unknown path under `/internal` returns `403` rather than `404` and does not disclose whether the route exists.

A user token — including an admin's — is rejected by `/internal` with `403`. The internal secret is rejected by `/admin` routes with `401`.

---

## A note on response shapes

Public and admin responses for the same problem are **deliberately different**, and this is not an inconsistency to code around:

| | Public | Admin |
|---|---|---|
| `difficulty` | `"Easy"` / `"Medium"` / `"Hard"` | `"EASY"` / `"MEDIUM"` / `"HARD"` (raw enum) |
| `tags` | `["Array", "Hash Table"]` | `[{ "tag": { "name": "Array" } }]` (raw relation) |
| `examples[]` | `input`, `output`, `explanation` | additionally `order` |
| `id`, `isPublished`, `createdAt`, `updatedAt` | absent | present |

Public responses pass through sanitizers that construct the object field by field. Admin responses return the repository's shape directly, because an authoring client needs the ids and the draft flag.

---

## What public responses never contain

No public endpoint returns any of the following, under any parameter combination:

| Excluded | Why |
|---|---|
| Hidden test cases (`TestCase` rows) | Reachable only via an admin token or the internal secret. `Example` and `TestCase` are separate tables. |
| Database ids | Not part of the public contract; the public identifier is the `slug`. |
| `isPublished`, `createdAt`, `updatedAt` | Internal/administrative fields. |
| `acceptanceRate`, `solvedCount`, `submissionCount` | Submission-derived aggregates. This service owns no submission data; a Judge Service will. |
| Per-user `status` (solved/attempted/todo) | Per-user progress derived from submissions. Not owned here. |

Unpublished problems are also invisible: they are excluded from listings and totals, omitted from tag counts, and a request for one by slug returns exactly the same `404` as an unknown slug.

---

## Health

### GET /health

- **Authentication:** None
- **Purpose:** Liveness check. Does not touch the database.

```json
{ "success": true, "service": "problem-service", "status": "healthy" }
```

---

## A. Public APIs

### GET /problems

- **Authentication:** None
- **Purpose:** Browse and filter the published problem catalogue.

#### Query parameters

| Parameter | Type | Default | Rules |
|---|---|---|---|
| `search` | string | none | Case-insensitive substring match on title. |
| `difficulty` | string | `all` | One of `Easy`, `Medium`, `Hard`, `all`. |
| `tag` | string | `all` | Exact tag name, or `all`. |
| `page` | integer | `1` | Minimum 1. |
| `pageSize` | integer | `8` | Between 1 and 50. |

The query schema is **strict**: any unrecognised parameter is a `400`, not an ignored filter. There is no sort parameter — results are always ordered by creation time, newest first.

#### Success — `200 OK`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "slug": "two-sum",
        "title": "Two Sum",
        "difficulty": "Easy",
        "summary": "Find two numbers in an array that add up to a target value.",
        "tags": ["Array", "Hash Table"]
      }
    ],
    "total": 11,
    "page": 1,
    "pageSize": 8
  }
}
```

`total` is the count of all published problems matching the filters, not the size of the current page.

#### Errors

| Status | Cause |
|---|---|
| 400 | `page` below 1 or non-numeric; `pageSize` outside 1–50; unsupported `difficulty`; any unrecognised query parameter. |

A filter that matches nothing is **not** an error — it returns `200` with `items: []` and `total: 0`.

---

### GET /problems/:slug

- **Authentication:** None
- **Purpose:** Full detail for one published problem.

#### Path parameters

| Parameter | Description |
|---|---|
| `slug` | The problem's public identifier, e.g. `two-sum`. |

The slug is not format-validated: a malformed slug simply matches nothing and returns the same `404` as an unknown one, matching how the User Service's `GET /users/:username` behaves.

#### Success — `200 OK`

```json
{
  "success": true,
  "data": {
    "problem": {
      "slug": "two-sum",
      "title": "Two Sum",
      "difficulty": "Easy",
      "summary": "Find two numbers in an array that add up to a target value.",
      "description": "Given an array of integers and a target value, ...",
      "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
      "functionSignature": {
        "name": "twoSum",
        "params": [
          { "name": "nums", "type": null },
          { "name": "target", "type": null }
        ],
        "returnType": null
      },
      "tags": ["Array", "Hash Table"],
      "examples": [
        {
          "input": "nums = [2, 7, 11, 15], target = 9",
          "output": "[0, 1]",
          "explanation": "nums[0] + nums[1] = 2 + 7 = 9."
        }
      ]
    }
  }
}
```

Examples are returned in their authored order. `explanation` may be `null`.

`functionSignature` is language-agnostic; translating it into per-language starter code is the Judge Service's job. `type` and `returnType` are nullable and are `null` for all seeded problems — see [Function signature types](#function-signature-types).

#### Errors

| Status | Message | Cause |
|---|---|---|
| 404 | `"Problem not found"` | No published problem with that slug — including the case where the problem exists but is unpublished. |

---

### GET /tags

- **Authentication:** None
- **Purpose:** Tag list for the catalogue's topic filter.

#### Success — `200 OK`

```json
{
  "success": true,
  "data": {
    "tags": [
      { "tag": "Array", "count": 3 },
      { "tag": "Backtracking", "count": 1 }
    ]
  }
}
```

Sorted by tag name. `count` counts **published problems only**, and a tag whose problems are all unpublished is omitted from the list entirely — so draft problems leak neither through the counts nor through the tag list.

---

## B. Admin APIs

All routes below require an admin token (see [Authentication](#authentication)). Shared error cases:

| Status | Message | Cause |
|---|---|---|
| 401 | `"Unauthorized"` | Missing, malformed, expired, or wrongly-signed token. |
| 403 | `"Forbidden"` | Valid token whose `role` is not `ADMIN`. |

Every request body is validated by a **strict** Zod schema: any unrecognised field is a `400`, which is what prevents mass assignment of fields like `id` or `isPublished` through an unintended path.

### GET /admin/problems

- **Purpose:** List problems for management, **including unpublished drafts**.
- **Query parameters:** identical to [`GET /problems`](#get-problems).

#### Success — `200 OK`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "4c22afa5-3faa-4885-9e16-b02e83ebdbd1",
        "slug": "n-queens",
        "title": "N-Queens",
        "difficulty": "HARD",
        "summary": "Place n chess queens on an n×n board so that none attack each other.",
        "isPublished": true,
        "createdAt": "2026-08-21T17:09:22.945Z",
        "updatedAt": "2026-08-21T17:58:06.439Z",
        "tags": [{ "tag": { "name": "Backtracking" } }]
      }
    ],
    "total": 11,
    "page": 1,
    "pageSize": 8
  }
}
```

This listing does **not** include test cases; those have their own endpoints.

---

### GET /admin/problems/:id

- **Purpose:** Full detail for one problem by id, including drafts.

#### Success — `200 OK`

`data.problem` contains: `id`, `slug`, `title`, `difficulty` (raw enum), `summary`, `description`, `constraints`, `functionSignature`, `isPublished`, `tags` (raw relation shape), `examples` (including `order`).

Test cases are **not** included — they are only available through the dedicated test-case endpoints, so there is exactly one code path that returns hidden data.

#### Errors

| Status | Message | Cause |
|---|---|---|
| 404 | `"Problem not found"` | Unknown id. A malformed id also returns `404` rather than a validation error. |

---

### POST /admin/problems

- **Purpose:** Create a problem.

#### Request body

| Field | Type | Required | Rules |
|---|---|---|---|
| `slug` | string | Yes | Lowercase kebab-case (`^[a-z0-9]+(-[a-z0-9]+)*$`), max 80 chars. |
| `title` | string | Yes | 1–200 chars. |
| `difficulty` | string | Yes | `Easy`, `Medium` or `Hard` (stored uppercase). |
| `summary` | string | Yes | 1–300 chars. |
| `description` | string | Yes | 1–5000 chars. |
| `constraints` | string[] | No (default `[]`) | Each entry non-empty. |
| `tags` | string[] | No (default `[]`) | Each 1–50 chars. Created if new, reused if existing. Duplicates are de-duplicated. |
| `functionSignature` | object | Yes | See [Function signature types](#function-signature-types). |
| `examples` | object[] | Yes | Each `{ input, output, explanation? }`; `input`/`output` non-empty. Order is taken from array position. |
| `isPublished` | boolean | No | Defaults to `false` — **new problems are drafts and are not publicly visible until published.** |

#### Success — `201 Created`

```json
{ "success": true, "message": "Problem created", "data": { "problem": { "...": "admin problem shape" } } }
```

#### Errors

| Status | Message | Cause |
|---|---|---|
| 400 | `"<field>: <reason>"` | Validation failure, including any unrecognised field. |
| 409 | `"Slug is already in use"` | The slug belongs to an existing problem. |

---

### PATCH /admin/problems/:id

- **Purpose:** Update a problem. Partial — only supplied fields change.

#### Request body

Any subset of the `POST` fields. At least one field must be present.

Two fields have **replace, not merge** semantics: supplying `examples` or `tags` replaces that collection entirely. Omitting them leaves the existing collection untouched.

#### Success — `200 OK`

```json
{ "success": true, "message": "Problem updated", "data": { "problem": { "...": "admin problem shape" } } }
```

#### Errors

| Status | Message | Cause |
|---|---|---|
| 400 | `": At least one field must be provided"` | Empty body. |
| 400 | `"<field>: <reason>"` | Validation failure, including any unrecognised field. |
| 404 | `"Problem not found"` | Unknown id. |
| 409 | `"Slug is already in use"` | The new slug belongs to another problem. |

---

### DELETE /admin/problems/:id

- **Purpose:** Delete a problem and everything belonging to it.

Deletion cascades at the database level to the problem's tag associations, examples and test cases. Tag rows themselves are not deleted.

#### Success — `200 OK`

```json
{ "success": true, "message": "Problem deleted" }
```

#### Errors

| Status | Message | Cause |
|---|---|---|
| 404 | `"Problem not found"` | Unknown id, or already deleted. |

---

### GET /admin/problems/:id/test-cases

- **Purpose:** Read a problem's hidden test cases for authoring.

#### Success — `200 OK`

```json
{
  "success": true,
  "data": {
    "testCases": [
      { "id": "9a30a099-...", "input": "doc-in-1", "expectedOutput": "doc-out-1", "order": 0 }
    ]
  }
}
```

A problem with no test cases returns `200` with an empty array — that is a valid state, distinct from an unknown problem, which is a `404`.

#### Errors

| Status | Message | Cause |
|---|---|---|
| 404 | `"Problem not found"` | Unknown or malformed id. |

---

### PUT /admin/problems/:id/test-cases

- **Purpose:** Replace a problem's **entire** test-case set atomically.

#### Request body

| Field | Type | Rules |
|---|---|---|
| `testCases` | object[] | 1–100 entries. |
| `testCases[].input` | string | Non-empty, max 10,000 characters. |
| `testCases[].expectedOutput` | string | Non-empty, max 10,000 characters. |

Notes:

- **`order` is not accepted.** Position in the array determines order, which makes duplicate or gapped ordering impossible. Sending `order` is a `400`, not a silently ignored value.
- **Strings are not trimmed.** A judge compares output byte for byte, so leading indentation and a trailing newline are significant data and are stored exactly as sent.
- **There is no way to clear all test cases** — the minimum of one means an empty array is rejected. See [Known limitations](README.md#known-limitations-and-future-work).

#### Behaviour

The existence check, the delete and the insert all run inside a single Prisma transaction. A failure at any point rolls the whole operation back, so the previous test cases remain intact; there is no window in which a problem has a partially-replaced set.

#### Success — `200 OK`

```json
{
  "success": true,
  "message": "Test cases replaced",
  "data": { "testCases": [ { "id": "...", "input": "...", "expectedOutput": "...", "order": 0 } ] }
}
```

#### Errors

| Status | Message | Cause |
|---|---|---|
| 400 | `"testCases: At least one test case is required"` | Empty array. |
| 400 | `"testCases: At most 100 test cases are allowed"` | More than 100 entries. |
| 400 | `"<field>: <reason>"` | Missing/empty `input` or `expectedOutput`, a field over 10,000 characters, a supplied `order`, or any unrecognised key. |
| 404 | `"Problem not found"` | Unknown id; nothing is written. |
| 413 | `"request entity too large"` | Body over `express.json()`'s 100 kB limit, rejected before validation. |

---

## C. Internal Judge API

Intended for the future Judge Service only. Not reachable by the frontend, and not authenticated with a user token.

### GET /internal/problems/:id/test-cases

- **Authentication:** `X-Internal-Service-Token: <INTERNAL_SERVICE_SECRET>`
- **Purpose:** Retrieve the complete hidden test-case set for one problem, so a submission can be graded.

Returns the whole set, unpaginated and unfiltered — a judge needs every case to grade a submission, not a page of them.

#### Success — `200 OK`

```json
{
  "success": true,
  "data": {
    "testCases": [
      { "input": "doc-in-1", "expectedOutput": "doc-out-1", "order": 0 },
      { "input": "doc-in-2", "expectedOutput": "doc-out-2", "order": 1 }
    ]
  }
}
```

The database `id` is **omitted** here, unlike the admin shape: the judge needs the case data and its position, not a way to address a Problem Service row by primary key.

Ordering and whitespace are preserved exactly as stored.

This endpoint is **not** restricted to published problems — a judge may legitimately need to run a draft problem's test cases.

#### Errors

| Status | Message | Cause |
|---|---|---|
| 403 | `"Forbidden"` | Missing header, wrong secret, a user or admin JWT presented instead, or the server has no secret configured. All are indistinguishable. |
| 404 | `"Problem not found"` | Unknown or malformed id (only reachable once the secret is correct). |

---

## Function signature types

`functionSignature` has the canonical shape:

```json
{ "name": "twoSum", "params": [{ "name": "nums", "type": "int[]" }], "returnType": "int[]" }
```

`type` and `returnType` are **nullable** and are `null` for every seeded problem, because the source dataset carried no type information. Nothing fabricates them.

When a type *is* supplied it must come from this vocabulary:

| Category | Accepted values |
|---|---|
| Primitives | `int`, `long`, `double`, `boolean`, `string`, `char` |
| Arrays | Any of the above with `[]` or `[][]` (1- or 2-dimensional) |
| Reference structures | `ListNode`, `TreeNode` (also array-suffixable) |

Anything else — `float`, a 3-dimensional array — is a `400`. The vocabulary is deliberately language-agnostic; the Judge Service will translate it into per-language signatures.

---

## Common response format

### Success

| Field | Type | Description |
|---|---|---|
| `success` | boolean | Always `true`. |
| `message` | string | Present on actions that create, change or delete something. Omitted on plain reads. |
| `data` | object | Present when the response carries a resource. |

### Error

```json
{ "success": false, "message": "<human-readable description>" }
```

| Status | Meaning |
|---|---|
| 400 | Validation failure. Multiple field messages are joined with `; ` in the form `"<field>: <reason>"`. |
| 401 | Not authenticated (admin routes). |
| 403 | Authenticated but not permitted (non-admin), or internal-secret failure. |
| 404 | Resource does not exist — or exists but is not publicly visible, or the route is unknown. |
| 409 | Conflicts with existing state (duplicate slug). |
| 413 | Request body exceeds the 100 kB limit. |
| 500 | Unexpected server fault. |

**`500` responses always read exactly `"Internal Server Error"`.** Messages are only echoed for errors known to be client-facing — this service's own deliberate errors, and framework errors such as a `413` or malformed JSON. Anything else, most importantly a raw Prisma failure, is replaced with the generic message and logged in full server-side, so the failing query, source excerpt, file path and database host never reach a client.
