# User Service

The User Service is the identity and account-management service for the CodeArena platform. It owns user registration, authentication (password-based and Google OAuth), email verification, password reset, profile data, and session management. It is a standalone Express application backed by PostgreSQL via Prisma, and issues JWT-based access and refresh tokens delivered as httpOnly cookies.

## Features

- **Registration** — creates a new user with a hashed password and issues an initial session and verification token.
- **Login** — authenticates with email and password and issues a new session.
- **Refresh Token Rotation** — exchanges a valid refresh token for a new access/refresh pair and invalidates the previous refresh token.
- **Logout** — revokes the caller's current session only.
- **Logout All** — revokes every session belonging to the authenticated user.
- **Email Verification** — confirms a user's email address using a single-use, hashed verification token.
- **Resend Verification** — issues a new verification token for an unverified account, invalidating any previous one.
- **Forgot Password** — requests a password reset without revealing whether the email address exists.
- **Reset Password** — consumes a single-use reset token, sets a new password, and revokes every session for that user.
- **Google OAuth** — sign-in or account creation via Google, using email as the unique identity so an account is never duplicated.
- **Profile APIs** — view and update the authenticated user's own profile, and view another user's public profile.
- **Session Management** — list active sessions, revoke a specific session, or revoke every other session while keeping the current one active.

## Technology Stack

- **Runtime:** Node.js (CommonJS)
- **Framework:** Express 5
- **Database:** PostgreSQL
- **ORM:** Prisma 6 (`@prisma/client`)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`); Google OAuth via Passport.js (`passport`, `passport-google-oauth20`)
- **Password hashing:** bcrypt
- **Token hashing:** Node's built-in `crypto` module (SHA-256) for refresh, verification, and password-reset tokens
- **Validation:** Zod
- **HTTP middleware:** Helmet (security headers), CORS, cookie-parser, Morgan (request logging)
- **Configuration:** dotenv
- **Development:** nodemon

## Project Structure

```
apps/user-service/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── auth/
│   ├── config/
│   ├── controllers/
│   ├── emails/
│   ├── middlewares/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   ├── app.js
│   └── server.js
├── .env.example
└── package.json
```

- **`controllers/`** — the HTTP layer. Parses the request, calls the relevant service, and shapes the JSON response. Contains no business logic or direct database access.
- **`services/`** — business logic. Orchestrates repositories, the auth utilities, and the email service; owns Prisma transaction boundaries for multi-step writes.
- **`repositories/`** — data access only, one file per data domain (`user`, `session`, `verificationToken`, `passwordResetToken`). Thin wrappers around the Prisma client with no business rules.
- **`middlewares/`** — cross-cutting request handling: JWT authentication (`auth.middleware.js`), Zod request validation (`validate.middleware.js`), centralized error formatting, 404 handling, and request logging.
- **`validators/`** — Zod schemas for request payloads, grouped by domain (`auth.validator.js`, `user.validator.js`).
- **`routes/`** — Express routers that wire middleware and controllers to specific paths; mounted onto the app in `app.js`.
- **`auth/`** — reusable authentication primitives: password hashing (`password.js`), JWT signing and verification (`jwt.js`), cookie helpers (`cookies.js`), and raw token generation/hashing for refresh, verification, and reset tokens (`token.js`).
- **`emails/`** — an email-sending abstraction (`email.service.js`). The current implementation logs a structured payload to the console instead of calling a real provider, so a provider can be integrated later without changing any calling code.
- **`utils/`** — generic, cross-domain helpers: `ApiError` (typed HTTP errors), the `sanitizeUser` / `sanitizePublicUser` / `sanitizeSession` response sanitizers, and the `pickFields` primitive they're built on.
- **`config/`** — environment variable loading (`env.js`), the shared Prisma client instance (`prisma.js`), and the Passport Google strategy configuration (`passport.js`).
- **`prisma/`** — the Prisma schema (`User`, `Session`, `VerificationToken`, `PasswordResetToken` models and the `Role` enum) and the generated migration history.

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the HTTP server listens on. |
| `NODE_ENV` | Runtime environment (e.g. `development`, `production`). Controls whether cookies are marked `secure`. |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma. |
| `JWT_ACCESS_SECRET` | Signing secret for access tokens. |
| `JWT_REFRESH_SECRET` | Signing secret for refresh tokens. Kept separate from the access secret so a leaked access token cannot be used to forge a refresh token. |
| `JWT_ACCESS_EXPIRES` | Access token lifetime (e.g. `15m`). |
| `JWT_REFRESH_EXPIRES` | Refresh token lifetime, and the lifetime of the underlying session row (e.g. `7d`). |
| `GOOGLE_CLIENT_ID` | OAuth client ID for the Google strategy. |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret for the Google strategy. |
| `GOOGLE_CALLBACK_URL` | Callback URL Google redirects to after authentication; must match the URL registered in the Google Cloud console. |
| `FRONTEND_URL` | Base URL of the frontend application. Used to build the redirect target after a Google OAuth login succeeds or fails. |

## Running Locally

1. Install dependencies:

   ```
   npm install
   ```

2. Start the required infrastructure (PostgreSQL and friends) from the repository root:

   ```
   docker compose up -d
   ```

3. Copy `.env.example` to `.env` and fill in real values for the variables listed above.

4. Apply the database schema:

   ```
   npx prisma migrate deploy
   ```

5. Start the service in development mode:

   ```
   npm run dev
   ```

The service listens on `PORT` (default `5000`) and exposes a health check at `GET /health`.

## Authentication Flow

- **Access Token** — a short-lived JWT (`JWT_ACCESS_EXPIRES`) signed with `JWT_ACCESS_SECRET`, containing the user's id and role. Sent to the client as an httpOnly cookie and required by every authenticated route.
- **Refresh Token** — a longer-lived JWT (`JWT_REFRESH_EXPIRES`) signed with `JWT_REFRESH_SECRET`, also sent as an httpOnly cookie. Only its SHA-256 hash is ever persisted, in the corresponding `Session` row.
- **Refresh Rotation** — `POST /auth/refresh` verifies the incoming refresh token, locates the session by matching the token's hash, and issues a brand-new access/refresh pair while overwriting the session's stored hash. The previous refresh token no longer matches any session and is rejected if reused.
- **Session Management** — each login, registration, or Google sign-in creates a `Session` row recording device, browser, IP address, user agent, and expiry. The refresh token's hash is what identifies "the current session" for operations like logout and session revocation. Sessions can be listed and revoked individually or in bulk through the `/sessions` endpoints.

## Security

- **Password hashing** — user passwords are hashed with bcrypt before storage; the raw password is never persisted or logged.
- **JWT-based authentication** — access and refresh tokens use separate secrets and separate expiries, so a compromised access token cannot be used to mint refresh tokens.
- **Refresh Token Rotation** — refresh tokens are single-use; rotating a session invalidates the previous token immediately.
- **SHA-256 token hashing** — refresh tokens, email verification tokens, and password reset tokens are all hashed before storage. SHA-256 (not bcrypt) is used deliberately, since bcrypt truncates input at 72 bytes and would treat distinct high-entropy tokens as equal.
- **Cookie security** — authentication cookies are `httpOnly`, `sameSite=lax`, marked `secure` in production, and scoped with a `maxAge` matching the underlying token's expiry.
- **Mass assignment protection** — `PATCH /users/me` is validated against a strict Zod schema that whitelists exactly the editable profile fields and rejects any unrecognized key, so fields like `role`, `email`, or `passwordHash` can never be updated through that endpoint.
- **IDOR protection** — session deletion always verifies the target session belongs to the authenticated user before deleting it; a session ID belonging to another user resolves as not found rather than being deleted.
- **Zod validation** — every endpoint that accepts a request body validates it with a Zod schema before any business logic runs.
- **User-enumeration resistance** — login and forgot-password return the same response regardless of whether the email exists, and login performs a constant-effort password comparison even when no matching account is found.
- **Transactions** — Prisma transactions wrap multi-step writes that must succeed or fail together, including registration (user, verification token, and session), email verification (marking the user verified and deleting the token), password reset (updating the password, revoking all sessions, and deleting the reset token), and Google account creation (user and session).

## API Overview

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Service health check |
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Authenticate with email and password |
| POST | `/auth/refresh` | Rotate the refresh token and issue a new token pair |
| POST | `/auth/logout` | Revoke the current session |
| POST | `/auth/logout-all` | Revoke every session for the authenticated user |
| POST | `/auth/verify-email` | Verify an email address using a verification token |
| POST | `/auth/resend-verification` | Issue a new email verification token |
| POST | `/auth/forgot-password` | Request a password reset |
| POST | `/auth/reset-password` | Reset a password using a reset token |
| GET | `/auth/google` | Start Google OAuth sign-in |
| GET | `/auth/google/callback` | Google OAuth callback |
| GET | `/users/me` | Get the authenticated user's profile |
| PATCH | `/users/me` | Update the authenticated user's profile |
| GET | `/users/:username` | Get a user's public profile |
| GET | `/sessions` | List active sessions for the authenticated user |
| DELETE | `/sessions/:id` | Revoke a specific session |
| DELETE | `/sessions` | Revoke every session except the current one |

## Future Services

The User Service is designed to run as one component of the larger CodeArena platform, alongside:

- **Gateway** — routes external traffic to the appropriate backend service.
- **Problem Service** — manages coding problems and their metadata.
- **Judge Service** — coordinates submission evaluation.
- **Judge Worker** — executes submissions and reports results.
