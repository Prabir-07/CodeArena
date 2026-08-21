# Problem Service

The Problem Service owns the coding-problem catalogue for the CodeArena platform: problem metadata, public worked examples, tags, and the hidden test cases a judge needs to grade a submission. It is a standalone Express application backed by its own PostgreSQL database via Prisma, and exposes three separate API surfaces — a public catalogue, an admin authoring API, and a service-to-service API for the future Judge Service.

## Responsibilities

The Problem Service **owns**:

- The problem catalogue — slug, title, difficulty, summary, description, constraints.
- The canonical, language-agnostic function signature for each problem.
- Public worked examples shown on a problem statement.
- Tags and their association with problems.
- Hidden test cases used for judging.
- Draft/published state, and the admin authoring API that manages all of the above.

The Problem Service **deliberately does not own**:

| Concern | Owner |
|---|---|
| Submissions, verdicts, code execution | Judge Service (not implemented) |
| Acceptance rate, solved count, submission count | Derived from submissions — no owner yet |
| Per-user solved/attempted/todo status, streaks, dashboard progress | Derived from submissions — no owner yet |
| Accounts, authentication, sessions | [User Service](../user-service/README.md) |
| Contests, leaderboards | Not implemented |

Nothing in this service reads or writes any of the above, and none of it appears in any response.

## Architecture

```
Route → Controller → Service → Repository → Prisma → PostgreSQL
```

- **`routes/`** — Express routers; attach middleware (auth, validation) and map paths to controllers.
- **`controllers/`** — HTTP layer only. Parse the request, call a service, shape the JSON response.
- **`services/`** — business logic, response sanitisation, and Prisma transaction boundaries.
- **`repositories/`** — data access only. Thin Prisma wrappers with explicit `select`s; no business rules.
- **`utils/sanitize*.js`** — build public/judge-facing response objects field by field, so a repository `select` cannot leak a new column by accident.

Every repository function takes an optional trailing Prisma client argument (defaulting to the shared one), which is how a multi-step operation runs inside a single `$transaction`.

## Technology stack

- **Runtime:** Node.js (CommonJS)
- **Framework:** Express 5
- **Database:** PostgreSQL 16
- **ORM:** Prisma 6
- **Validation:** Zod
- **Auth:** `jsonwebtoken` (verification only — this service never issues tokens)
- **HTTP middleware:** Helmet, cookie-parser, Morgan
- **Tests:** Node's built-in test runner (`node --test`) with native `fetch` — no test framework dependency

Note that `@prisma/client` is **not** a dependency. The Prisma client is generated into this service's own directory (see [Generated client isolation](#generated-client-isolation)) and is self-contained.

## Directory structure

```
apps/problem-service/
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   └── migrations/
├── src/
│   ├── auth/            # JWT verification helper
│   ├── config/          # env loading, Prisma singleton
│   ├── controllers/
│   ├── middlewares/     # auth, requireAdmin, internalAuth, validate, error, notFound, logger
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── utils/           # ApiError, response sanitizers
│   ├── validators/      # Zod schemas
│   ├── app.js
│   └── server.js
├── tests/               # integration suites + helpers
├── .env.example
└── package.json
```

## Environment variables

| Variable | Description |
|---|---|
| `PORT` | Port the HTTP server listens on. Defaults to `5001`. |
| `NODE_ENV` | Runtime environment. `test` silences request logging and unhandled-error logging. |
| `DATABASE_URL` | PostgreSQL connection string for this service's own database. |
| `JWT_ACCESS_SECRET` | **Must match the User Service's value exactly.** Used only to verify access tokens this service receives; it never issues or refreshes them. |
| `INTERNAL_SERVICE_SECRET` | Shared secret for the `/internal` routes, sent as the `X-Internal-Service-Token` header. Known only to this service and the future Judge Service. Never exposed to the frontend. |

Copy `.env.example` to `.env` and fill in real values. `.env` is gitignored and must never be committed.

## Database setup

This service uses its own PostgreSQL database, completely separate from the User Service's. Both containers are already defined in the repository root's `docker-compose.yml`:

| Container | Database | Host port | Used by |
|---|---|---|---|
| `codearena-postgres-users` | `users_db` | 5432 | User Service |
| `codearena-postgres-problems` | `problems_db` | 5433 | Problem Service |

Start the infrastructure from the repository root:

```bash
docker compose up -d
```

The Problem Service application itself is **not** containerised — there is no Dockerfile for it (or for any service in this repository yet). It runs directly on the host with Node.

## Prisma setup

### Generated client isolation

`prisma/schema.prisma` sets a service-local generator output:

```
output = "../src/generated/prisma-client"
```

This is deliberate and load-bearing. This is an npm-workspaces monorepo containing more than one Prisma schema; with the default output, both services generate into the same hoisted `node_modules/@prisma/client`, and whichever ran `prisma generate` last would silently break the other service's queries. The service-local path keeps the two clients from ever sharing a location.

Consequently, `src/config/prisma.js` and `prisma/seed.js` import from `../generated/prisma-client`, **not** from `@prisma/client`.

`src/generated/` is gitignored, so **a fresh clone must run `prisma generate` before the service will start.**

## Running locally

From the repository root:

```bash
npm install
```

```bash
docker compose up -d
```

Then, from `apps/problem-service/`:

```bash
cp .env.example .env
```

```bash
npx prisma generate
```

```bash
npx prisma migrate deploy
```

```bash
npx prisma db seed
```

Start the service (from the repository root):

```bash
npm run dev --workspace=problem-service
```

Use `npm run start --workspace=problem-service` for the non-watching equivalent. The service listens on `PORT` (default `5001`) and exposes a health check at `GET /health`, which does not touch the database.

### Migrations

The schema history lives in `prisma/migrations/`. Use `npx prisma migrate deploy` to apply existing migrations to any environment. `npx prisma migrate dev` is for authoring a new migration during development.

### Seeding

```bash
npx prisma db seed
```

The seed is idempotent — it upserts by slug and fully replaces each problem's examples, so re-running it does not duplicate data. It loads the 11 problems that were the repository's only existing problem dataset.

The seed creates **no test cases**, by design: the source dataset contains none, and fabricating hidden test data would give the judge meaningless input. Seeded problems legitimately have zero test cases until an admin authors them through the API.

## Running tests

From the repository root:

```bash
npm test --workspace=problem-service
```

The suite exercises the real Express app over real HTTP against a real PostgreSQL database — routes, middleware ordering, Helmet, body parsing, validation and error handling all stay in the path. It uses Node's built-in test runner and native `fetch`, so it adds no test-framework dependency.

At the time of writing, the suite reports **135 passing tests across 29 suites** in roughly 30 seconds. Treat that as a snapshot of the current verification result rather than a fixed guarantee — run the command for the authoritative count.

### Test database isolation

Tests truncate tables between cases, so they must never run against development data. `tests/helpers/env.js` derives a test connection string from your own `DATABASE_URL`, rewriting the schema parameter to `problem_service_test`. This needs no extra container, no `docker-compose` change and no second credentials file — and the helper **throws rather than running** if that rewrite does not take effect, so the suite cannot fall back onto the development `public` schema.

The test schema is created on demand: the helper probes for it and runs `prisma migrate deploy` only when it is genuinely absent.

Tests run sequentially (`--test-concurrency=1`) because they share one test schema.

## API documentation

See [API.md](API.md) for the full contract: public catalogue, admin authoring, and the internal Judge endpoint, with request/response shapes, validation rules and error cases.

See [DATABASE.md](DATABASE.md) for the schema, relationships, indexes and constraints.

## Security notes

- **Public endpoints require no authentication** and are the only routes reachable without a credential.
- **Admin endpoints** require a valid User Service access token *and* `role === "ADMIN"`.
- **Internal endpoints** require a shared secret, compared in constant time, and never accept a user token.
- **Hidden test cases are never returned by any public endpoint.** `Example` and `TestCase` are separate tables, and public responses are built by sanitizers that name every field explicitly.
- **Unexpected errors return a generic message.** A raw Prisma failure would otherwise serialise the failing query, a source excerpt, the file path and the database host into the response; the full detail is logged server-side instead.
- **Request logs contain no bodies or headers** — only method, path, status and timing — which is what keeps test-case content and the internal secret out of the logs.

See the Security section of [API.md](API.md#authentication) for the per-surface details.

## Relationship to the User Service

The two services share **no database and no runtime dependency**. This service holds no user table and issues no tokens.

The only coupling is the JWT signing secret: the User Service signs access tokens with `JWT_ACCESS_SECRET`, and this service verifies them independently with the same value, reading the `sub` and `role` claims. There is no callback to the User Service and no token exchange. Users are referenced by id only, and no foreign key crosses the database boundary.

## Relationship to the future Judge Service

The Judge Service does not exist yet. This service already provides the one thing it will need: `GET /internal/problems/:id/test-cases`, protected by `INTERNAL_SERVICE_SECRET`.

The Judge Service will own execution, verdicts, submission history and per-language starter-code generation. It will consume two things from this service: hidden test cases via the internal endpoint, and the canonical `functionSignature` from the public problem detail.

## Frontend integration

The frontend calls three public endpoints — `GET /problems`, `GET /problems/:slug`, `GET /tags` — through a dedicated request binding in `apps/frontend/src/lib/api/client.js` that sends **no cookies**, since these endpoints need no authentication. In development, Vite proxies `/problems` and `/tags` to port 5001.

The frontend never calls `/admin/*` or `/internal/*`, sends no `Authorization` header to this service, and never receives `INTERNAL_SERVICE_SECRET`.

Because this service does not own submission-derived data, three UI elements were removed when the frontend moved off its mock: the Acceptance and Status columns in the problem list, the per-problem stats card, and the Solved/Attempted/Todo filter tabs. They are expected to return once a Judge Service can supply real values. Judge, Contest, Leaderboard and Dashboard-progress functionality in the frontend remains mocked, clearly labelled, and isolated in its own adapter modules.

## Known limitations and future work

**Not implemented yet** (other services, outside this service's scope):

- Judge Service — execution, verdicts, submission history, per-language starter code.
- Contest and Leaderboard backends.
- Dashboard/progress backend.
- Per-problem statistics (acceptance rate, solved count, submission count).

**Intentional architectural boundaries** (working as designed, not gaps):

- No submission-derived data is served or stored here.
- Public and admin responses differ in shape by design — see the note in [API.md](API.md#a-note-on-response-shapes).
- Hidden test cases are unreachable without either an admin token or the internal secret.

**Current limitations worth revisiting:**

- **Test cases cannot be cleared.** `PUT /admin/problems/:id/test-cases` requires at least one case, so there is no way to remove every test case from a problem short of deleting the problem itself.
- **Test-case size limits may be too small for real judging.** A test case is capped at 10,000 characters per field and 100 cases per request, and `express.json()`'s 100 kB default bounds the whole body. Competitive-programming inputs routinely exceed this. These limits and the body limit will likely need revisiting together once the Judge Service defines its real requirements.
- **Tags are never garbage-collected.** A tag whose last problem association is removed stays in the `tags` table. It is correctly hidden from `GET /tags` (which counts only published problems), so this is untidiness rather than incorrect behaviour.
- **`functionSignature` types are unpopulated.** All seeded problems carry `type: null` for every parameter and for `returnType`, because the source dataset had no type information. The validator accepts types when supplied; nothing fabricates them.

**Possible future hardening:**

- **JWT algorithm pinning.** `jwt.verify` is called without an explicit `algorithms` option, matching the User Service. This is not currently exploitable — `jsonwebtoken` v9 restricts verification to HMAC algorithms when the key is a string, and a forged unsigned token is rejected (covered by the test suite) — but pinning `['HS256']` would make the guarantee explicit.

**Noted elsewhere in the repository:**

- The **User Service** returns `err.message` verbatim for any error, so an unhandled database failure there can disclose internal detail in the same way this service's error handler was hardened against. That service was out of scope for the Problem Service milestones and is unchanged.
