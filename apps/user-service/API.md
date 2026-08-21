# User Service API

This document describes every HTTP endpoint currently implemented by the User Service. It reflects the code as it exists today.

All routes are relative to the service's base URL (e.g. `http://localhost:5000`). All request and response bodies are JSON unless otherwise noted.

**Sections**

- [Authentication](#authentication)
- [Email Authentication](#email-authentication)
- [OAuth](#oauth)
- [Profile](#profile)
- [Sessions](#sessions)
- [Common Response Format](#common-response-format)

---

## Authentication

### POST /auth/register

#### Endpoint

- **Method:** POST
- **Route:** `/auth/register`
- **Purpose:** Create a new user account.
- **Authentication Required:** No

#### Request

- **Headers:** `Content-Type: application/json`
- **Cookies:** None
- **Query Parameters:** None
- **Path Parameters:** None
- **Request Body:**

| Field | Type | Rules |
|---|---|---|
| `username` | string | Trimmed. 3–30 characters. Letters, numbers, and underscores only. |
| `email` | string | Trimmed, lowercased. Must be a valid email address. |
| `password` | string | 8–72 characters. Must contain a lowercase letter, an uppercase letter, a number, and a special character. |
| `firstName` | string | Trimmed. 1–50 characters. |
| `lastName` | string | Trimmed. 1–50 characters. |

#### Success Response

- **Status Code:** `201 Created`
- **Sets cookies:** `accessToken`, `refreshToken`
- **JSON structure:**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "<string>",
      "username": "<string>",
      "email": "<string>",
      "firstName": "<string>",
      "lastName": "<string>",
      "avatar": null,
      "bio": null,
      "country": null,
      "college": null,
      "githubUrl": null,
      "linkedinUrl": null,
      "portfolioUrl": null,
      "role": "USER",
      "isEmailVerified": false,
      "createdAt": "<ISO 8601 datetime>",
      "updatedAt": "<ISO 8601 datetime>"
    }
  }
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 400 | `"<field>: <reason>"` (one or more, joined with `; `) | Request body failed validation. |
| 409 | `"Email is already registered"` | The email is already in use. |
| 409 | `"Username is already taken"` or `"Username is already registered"` | The username is already in use. The exact wording depends on whether the conflict was caught by the pre-check (`"already taken"`) or by the database's unique constraint on a concurrent request (`"already registered"`). |

#### Notes

- On success, a verification token is generated and stored (hashed) but is not included in the response and no email is sent by this endpoint; it exists to support the email verification flow via `/auth/resend-verification`.
- User creation, verification token creation, and the initial session are created together in a single database transaction.
- New accounts are created with `role: "USER"` and `isEmailVerified: false`.
- `passwordHash` is never included in any response.

---

### POST /auth/login

#### Endpoint

- **Method:** POST
- **Route:** `/auth/login`
- **Purpose:** Authenticate with email and password and start a new session.
- **Authentication Required:** No

#### Request

- **Headers:** `Content-Type: application/json`
- **Cookies:** None
- **Query Parameters:** None
- **Path Parameters:** None
- **Request Body:**

| Field | Type | Rules |
|---|---|---|
| `email` | string | Trimmed, lowercased. Must be a valid email address. |
| `password` | string | Required, non-empty. Maximum 72 characters. |

#### Success Response

- **Status Code:** `200 OK`
- **Sets cookies:** `accessToken`, `refreshToken`
- **JSON structure:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "<string>",
      "username": "<string>",
      "email": "<string>",
      "firstName": "<string>",
      "lastName": "<string>",
      "avatar": null,
      "bio": null,
      "country": null,
      "college": null,
      "githubUrl": null,
      "linkedinUrl": null,
      "portfolioUrl": null,
      "role": "USER",
      "isEmailVerified": false,
      "createdAt": "<ISO 8601 datetime>",
      "updatedAt": "<ISO 8601 datetime>"
    }
  }
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 400 | `"<field>: <reason>"` | Request body failed validation. |
| 401 | `"Invalid email or password"` | The email does not match any account, or the password is incorrect. The same message and status are used for both cases. |

#### Notes

- A new session row is created on every successful login; existing sessions are not affected.
- To avoid revealing whether an email address is registered, an unknown email and a wrong password both return the identical `401` response, and a constant-effort password comparison is performed even when no account is found.

---

### POST /auth/refresh

#### Endpoint

- **Method:** POST
- **Route:** `/auth/refresh`
- **Purpose:** Exchange a valid refresh token for a new access/refresh token pair (refresh token rotation).
- **Authentication Required:** No (authenticated via the refresh token cookie instead of an access token)

#### Request

- **Headers:** None required
- **Cookies:** `refreshToken` (required)
- **Query Parameters:** None
- **Path Parameters:** None
- **Request Body:** None

#### Success Response

- **Status Code:** `200 OK`
- **Sets cookies:** `accessToken`, `refreshToken` (both replaced with newly issued values)
- **JSON structure:**

```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 401 | `"Invalid or expired refresh token"` | The `refreshToken` cookie is missing, is not a validly signed JWT, does not correspond to any stored session, or the matching session has expired. |

#### Notes

- The session's stored refresh token hash is overwritten with the newly issued token's hash. The previous refresh token no longer matches any session and is rejected if reused.
- If the matched session is found to be expired, the session row is deleted before the error is returned.
- The response body does not include the user object.

---

### POST /auth/logout

#### Endpoint

- **Method:** POST
- **Route:** `/auth/logout`
- **Purpose:** Revoke the caller's current session.
- **Authentication Required:** Yes

#### Request

- **Headers:** `Authorization: Bearer <accessToken>` (or the `accessToken` cookie)
- **Cookies:** `accessToken` (for authentication); `refreshToken` (used to identify which session is "current")
- **Query Parameters:** None
- **Path Parameters:** None
- **Request Body:** None

#### Success Response

- **Status Code:** `200 OK`
- **Clears cookies:** `accessToken`, `refreshToken`
- **JSON structure:**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 401 | `"Unauthorized"` | The access token is missing or invalid. |

#### Notes

- If the `refreshToken` cookie is missing or does not match any session for the caller, the endpoint still succeeds and clears the auth cookies; no error is raised.
- Only the one session matching the current refresh token is deleted. Other sessions belonging to the same user are unaffected.

---

### POST /auth/logout-all

#### Endpoint

- **Method:** POST
- **Route:** `/auth/logout-all`
- **Purpose:** Revoke every session belonging to the authenticated user.
- **Authentication Required:** Yes

#### Request

- **Headers:** `Authorization: Bearer <accessToken>` (or the `accessToken` cookie)
- **Cookies:** `accessToken`
- **Query Parameters:** None
- **Path Parameters:** None
- **Request Body:** None

#### Success Response

- **Status Code:** `200 OK`
- **Clears cookies:** `accessToken`, `refreshToken`
- **JSON structure:**

```json
{
  "success": true,
  "message": "Logged out from all devices"
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 401 | `"Unauthorized"` | The access token is missing or invalid. |

#### Notes

- Every session row for the authenticated user is deleted, including the one used to make this request.

---

## Email Authentication

### POST /auth/verify-email

#### Endpoint

- **Method:** POST
- **Route:** `/auth/verify-email`
- **Purpose:** Confirm a user's email address using a verification token.
- **Authentication Required:** No

#### Request

- **Headers:** `Content-Type: application/json`
- **Cookies:** None
- **Query Parameters:** None
- **Path Parameters:** None
- **Request Body:**

| Field | Type | Rules |
|---|---|---|
| `token` | string | Trimmed, non-empty. The raw verification token (not the stored hash). |

#### Success Response

- **Status Code:** `200 OK`
- **JSON structure:**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 400 | `"token: Verification token is required"` | The `token` field was missing or empty. |
| 400 | `"Invalid or expired verification token"` | No stored token matches the hash of the supplied token, or the matching token has expired. |

#### Notes

- The token is hashed with SHA-256 before being looked up; the raw token is never stored.
- On success, `user.isEmailVerified` is set to `true` and the verification token row is deleted in the same database transaction, so a token can only be used once.
- If the matching token is expired, its row is deleted before the error is returned.

---

### POST /auth/resend-verification

#### Endpoint

- **Method:** POST
- **Route:** `/auth/resend-verification`
- **Purpose:** Issue a new email verification token for the authenticated (unverified) user.
- **Authentication Required:** Yes

#### Request

- **Headers:** `Authorization: Bearer <accessToken>` (or the `accessToken` cookie)
- **Cookies:** `accessToken`
- **Query Parameters:** None
- **Path Parameters:** None
- **Request Body:** None

#### Success Response

- **Status Code:** `200 OK`
- **JSON structure:**

```json
{
  "success": true,
  "message": "Verification email sent"
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 401 | `"Unauthorized"` | The access token is missing or invalid. |
| 404 | `"User not found"` | The authenticated user no longer exists. |
| 409 | `"Email is already verified"` | The user's email is already verified. |

#### Notes

- Any previously issued, unused verification tokens for the user are deleted before the new one is created.
- The new token is passed to the email service (`sendVerificationEmail`), which currently logs the payload to the console rather than sending a real email.
- The raw token itself is never returned in the response.

---

### POST /auth/forgot-password

#### Endpoint

- **Method:** POST
- **Route:** `/auth/forgot-password`
- **Purpose:** Request a password reset link for an account.
- **Authentication Required:** No

#### Request

- **Headers:** `Content-Type: application/json`
- **Cookies:** None
- **Query Parameters:** None
- **Path Parameters:** None
- **Request Body:**

| Field | Type | Rules |
|---|---|---|
| `email` | string | Trimmed, lowercased. Must be a valid email address. |

#### Success Response

- **Status Code:** `200 OK`
- **JSON structure:**

```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent"
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 400 | `"email: Invalid email address"` | The `email` field was missing or not a valid email format. |

#### Notes

- This endpoint always returns the same `200` response with the same message, whether or not the email address is registered. This is intentional and prevents an attacker from using this endpoint to discover which email addresses have accounts.
- If the account exists, any previous unused reset tokens for that user are deleted, a new one is created, and it is passed to the email service (`sendPasswordResetEmail`), which currently logs the payload to the console.
- If the account does not exist, no token is created and no email is logged.

---

### POST /auth/reset-password

#### Endpoint

- **Method:** POST
- **Route:** `/auth/reset-password`
- **Purpose:** Set a new password using a password reset token.
- **Authentication Required:** No

#### Request

- **Headers:** `Content-Type: application/json`
- **Cookies:** None
- **Query Parameters:** None
- **Path Parameters:** None
- **Request Body:**

| Field | Type | Rules |
|---|---|---|
| `token` | string | Trimmed, non-empty. The raw reset token. |
| `newPassword` | string | 8–72 characters. Must contain a lowercase letter, an uppercase letter, a number, and a special character. |

#### Success Response

- **Status Code:** `200 OK`
- **JSON structure:**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 400 | `"<field>: <reason>"` | The `token` was missing/empty, or `newPassword` did not meet the complexity requirements. |
| 400 | `"Invalid or expired reset token"` | No stored token matches the hash of the supplied token, or the matching token has expired. |

#### Notes

- The token is hashed with SHA-256 before being looked up.
- On success, the user's password is updated, **every** session belonging to that user is deleted, and the reset token row is deleted — all in a single database transaction. This means resetting a password logs the user out everywhere.
- If the matching token is expired, its row is deleted before the error is returned.

---

## OAuth

### GET /auth/google

#### Endpoint

- **Method:** GET
- **Route:** `/auth/google`
- **Purpose:** Start the Google OAuth sign-in flow.
- **Authentication Required:** No

#### Request

- **Headers:** None required
- **Cookies:** None
- **Query Parameters:** None
- **Path Parameters:** None
- **Request Body:** None

#### Success Response

- **Status Code:** `302 Found`
- **Behavior:** Redirects the browser to Google's OAuth consent screen (`accounts.google.com`), with the `client_id`, `redirect_uri` (`GOOGLE_CALLBACK_URL`), and `scope=profile email` query parameters set. There is no JSON response body.

#### Error Responses

This endpoint does not produce application-level JSON errors; it only redirects to Google.

#### Notes

- Implemented with Passport's `google` strategy in stateless mode (`session: false`); no server-side OAuth session is created.

---

### GET /auth/google/callback

#### Endpoint

- **Method:** GET
- **Route:** `/auth/google/callback`
- **Purpose:** Handle Google's redirect back after the user authenticates, and complete sign-in or account creation.
- **Authentication Required:** No (this endpoint is itself part of the authentication process)

#### Request

- **Headers:** None required
- **Cookies:** None
- **Query Parameters:** Supplied by Google (e.g. `code`, `state`); consumed internally by Passport and not read directly by application code.
- **Path Parameters:** None
- **Request Body:** None

#### Success Response

- **Status Code:** `302 Found`
- **Sets cookies:** `accessToken`, `refreshToken`
- **Behavior:** Redirects to `<FRONTEND_URL>?auth=success`. There is no JSON response body.

#### Error Responses

| Status | Cause |
|---|---|
| `302` redirect to `<FRONTEND_URL>?auth=failure` | Passport's Google strategy itself fails (e.g. the user denies consent, or Google authentication otherwise fails). |
| `400` JSON error, `"Google account did not provide an email address"` | Google authentication succeeded but the returned profile had no email address. Unlike the case above, this is an application-level error returned as JSON, not a redirect. |

#### Notes

- If the email from the Google profile matches an existing user, that user is logged in and a new session is created.
- If no user matches, a new user is created with `passwordHash: null`, `isEmailVerified: true`, and a username generated from the local part of the email address (sanitized to letters/numbers/underscores, with a random suffix appended if the base username is already taken).
- User creation and the initial session are created together in a single database transaction.
- Matching is done by email only; there is no separate "Google account ID" field. A user can register with a password and later sign in with Google (or vice versa) as long as the email matches, and no duplicate account is created either way.

---

## Profile

### GET /users/me

#### Endpoint

- **Method:** GET
- **Route:** `/users/me`
- **Purpose:** Get the authenticated user's own profile.
- **Authentication Required:** Yes

#### Request

- **Headers:** `Authorization: Bearer <accessToken>` (or the `accessToken` cookie)
- **Cookies:** `accessToken`
- **Query Parameters:** None
- **Path Parameters:** None
- **Request Body:** None

#### Success Response

- **Status Code:** `200 OK`
- **JSON structure:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "<string>",
      "username": "<string>",
      "email": "<string>",
      "firstName": "<string>",
      "lastName": "<string>",
      "avatar": null,
      "bio": null,
      "country": null,
      "college": null,
      "githubUrl": null,
      "linkedinUrl": null,
      "portfolioUrl": null,
      "role": "USER",
      "isEmailVerified": false,
      "createdAt": "<ISO 8601 datetime>",
      "updatedAt": "<ISO 8601 datetime>"
    }
  }
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 401 | `"Unauthorized"` | The access token is missing or invalid. |
| 404 | `"User not found"` | The authenticated user no longer exists. |

#### Notes

- This is the only endpoint that returns the caller's `email`, `role`, and `isEmailVerified`; the public profile endpoint below does not.

---

### PATCH /users/me

#### Endpoint

- **Method:** PATCH
- **Route:** `/users/me`
- **Purpose:** Update fields on the authenticated user's own profile.
- **Authentication Required:** Yes

#### Request

- **Headers:** `Content-Type: application/json`; `Authorization: Bearer <accessToken>` (or the `accessToken` cookie)
- **Cookies:** `accessToken`
- **Query Parameters:** None
- **Path Parameters:** None
- **Request Body:** At least one of the following fields. Any field not listed here is rejected.

| Field | Type | Rules |
|---|---|---|
| `firstName` | string | Trimmed. 1–50 characters. |
| `lastName` | string | Trimmed. 1–50 characters. |
| `avatar` | string or `null` | Trimmed. Must be a valid URL. Maximum 2048 characters. |
| `bio` | string or `null` | Trimmed. Maximum 500 characters. |
| `country` | string or `null` | Trimmed. Maximum 100 characters. |
| `college` | string or `null` | Trimmed. Maximum 150 characters. |
| `githubUrl` | string or `null` | Trimmed. Must be a valid URL. Maximum 2048 characters. |
| `linkedinUrl` | string or `null` | Trimmed. Must be a valid URL. Maximum 2048 characters. |
| `portfolioUrl` | string or `null` | Trimmed. Must be a valid URL. Maximum 2048 characters. |

#### Success Response

- **Status Code:** `200 OK`
- **JSON structure:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "<string>",
      "username": "<string>",
      "email": "<string>",
      "firstName": "<string>",
      "lastName": "<string>",
      "avatar": null,
      "bio": null,
      "country": null,
      "college": null,
      "githubUrl": null,
      "linkedinUrl": null,
      "portfolioUrl": null,
      "role": "USER",
      "isEmailVerified": false,
      "createdAt": "<ISO 8601 datetime>",
      "updatedAt": "<ISO 8601 datetime>"
    }
  }
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 401 | `"Unauthorized"` | The access token is missing or invalid. |
| 400 | `": Unrecognized key: \"<field>\""` | The body contained a field that is not in the allowed list above (e.g. `email`, `username`, `role`, `passwordHash`). Note the leading `": "` — this is a characteristic of how validation errors without a specific field path are formatted. |
| 400 | `": At least one field must be provided"` | The request body was empty (or contained only unrecognized keys). |
| 400 | `"<field>: <reason>"` | A provided field failed its own validation (e.g. an invalid URL, or a value exceeding its maximum length). |
| 404 | `"User not found"` | The authenticated user no longer exists. |

#### Notes

- The request body is validated against a strict whitelist that only allows the fields listed above; `email`, `username`, `role`, `passwordHash`, `isEmailVerified`, `createdAt`, and `updatedAt` can never be modified through this endpoint, regardless of what is sent.
- Only the fields present in the request are changed; omitted fields are left unmodified.
- Setting a nullable field explicitly to `null` clears it.

---

### GET /users/:username

#### Endpoint

- **Method:** GET
- **Route:** `/users/:username`
- **Purpose:** Get another user's public profile.
- **Authentication Required:** No

#### Request

- **Headers:** None required
- **Cookies:** None
- **Query Parameters:** None
- **Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `username` | string | The username to look up. |

- **Request Body:** None

#### Success Response

- **Status Code:** `200 OK`
- **JSON structure:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "<string>",
      "username": "<string>",
      "firstName": "<string>",
      "lastName": "<string>",
      "avatar": null,
      "bio": null,
      "country": null,
      "college": null,
      "githubUrl": null,
      "linkedinUrl": null,
      "portfolioUrl": null,
      "createdAt": "<ISO 8601 datetime>"
    }
  }
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 404 | `"User not found"` | No user exists with the given username. |

#### Notes

- This response deliberately excludes `email`, `role`, `isEmailVerified`, `updatedAt`, and `passwordHash` — it is a stricter field set than `GET /users/me`.
- This route is registered after `/users/me` so that a request for `/users/me` is never mistakenly matched as a lookup for a user literally named "me".

---

## Sessions

All endpoints in this section require authentication.

### GET /sessions

#### Endpoint

- **Method:** GET
- **Route:** `/sessions`
- **Purpose:** List every active session belonging to the authenticated user.
- **Authentication Required:** Yes

#### Request

- **Headers:** `Authorization: Bearer <accessToken>` (or the `accessToken` cookie)
- **Cookies:** `accessToken`
- **Query Parameters:** None
- **Path Parameters:** None
- **Request Body:** None

#### Success Response

- **Status Code:** `200 OK`
- **JSON structure:**

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "<string>",
        "deviceName": null,
        "browser": null,
        "ipAddress": "<string>",
        "userAgent": "<string>",
        "createdAt": "<ISO 8601 datetime>",
        "expiresAt": "<ISO 8601 datetime>"
      }
    ]
  }
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 401 | `"Unauthorized"` | The access token is missing or invalid. |

#### Notes

- `refreshTokenHash` is never included in the response.
- `deviceName` and `browser` are fields in the underlying data model reserved for future device/browser detection; nothing in the current implementation populates them, so they are always `null` today.
- Only sessions belonging to the authenticated user are returned.

---

### DELETE /sessions/:id

#### Endpoint

- **Method:** DELETE
- **Route:** `/sessions/:id`
- **Purpose:** Revoke a specific session.
- **Authentication Required:** Yes

#### Request

- **Headers:** `Authorization: Bearer <accessToken>` (or the `accessToken` cookie)
- **Cookies:** `accessToken`; `refreshToken` (optional — used only to determine whether the session being deleted is the caller's current one)
- **Query Parameters:** None
- **Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `id` | string | The id of the session to delete. |

- **Request Body:** None

#### Success Response

- **Status Code:** `200 OK`
- **Clears cookies:** `accessToken`, `refreshToken` — only if the deleted session is the one identified by the caller's own `refreshToken` cookie.
- **JSON structure:**

```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 401 | `"Unauthorized"` | The access token is missing or invalid. |
| 404 | `"Session not found"` | No session with that id exists, **or** it exists but belongs to a different user. Both cases return the identical response, so a caller cannot distinguish "doesn't exist" from "belongs to someone else." |

#### Notes

- Ownership is verified before deletion; a session id belonging to another user can never be deleted through this endpoint.
- Deleting a non-current session does not clear cookies or otherwise affect the caller's active session.

---

### DELETE /sessions

#### Endpoint

- **Method:** DELETE
- **Route:** `/sessions`
- **Purpose:** Revoke every session belonging to the authenticated user except the one currently in use.
- **Authentication Required:** Yes

#### Request

- **Headers:** `Authorization: Bearer <accessToken>` (or the `accessToken` cookie)
- **Cookies:** `accessToken`; `refreshToken` (required — used to identify which session must be preserved)
- **Query Parameters:** None
- **Path Parameters:** None
- **Request Body:** None

#### Success Response

- **Status Code:** `200 OK`
- **JSON structure:**

```json
{
  "success": true,
  "message": "All other sessions deleted successfully"
}
```

#### Error Responses

| Status | Message | Cause |
|---|---|---|
| 401 | `"Unauthorized"` | The access token is missing or invalid. |
| 400 | `"Current session could not be identified"` | The `refreshToken` cookie is missing, or it does not match any session belonging to the authenticated user. |

#### Notes

- Unlike `DELETE /sessions/:id`, the `refreshToken` cookie is required here: without it, the service cannot determine which session to exclude, and refuses to act rather than risk deleting the caller's own active session.
- The session matching the caller's current `refreshToken` is never deleted by this endpoint.

---

## Common Response Format

### Success Response

Every successful response is a JSON object with:

| Field | Type | Description |
|---|---|---|
| `success` | boolean | Always `true`. |
| `message` | string | Present on actions that create, change, or delete something. Omitted on plain reads (e.g. `GET /users/me`, `GET /sessions`). |
| `data` | object | Present when the response includes a resource (e.g. `{ "user": { ... } }` or `{ "sessions": [ ... ] }`). Omitted on endpoints that only report success (e.g. `POST /auth/refresh`, `POST /auth/logout`). |

```json
{
  "success": true,
  "message": "<optional>",
  "data": { "...": "optional" }
}
```

### Error Response

Every error response — whether raised by request validation, authentication, business logic, or an unexpected server error — is a JSON object with the same two fields:

```json
{
  "success": false,
  "message": "<human-readable description of what went wrong>"
}
```

| Field | Type | Description |
|---|---|---|
| `success` | boolean | Always `false`. |
| `message` | string | A human-readable description of the error. For request validation failures, this may contain multiple field-level messages joined with `; `, in the form `"<field>: <reason>"`. |

The HTTP status code carries the error category and follows the same convention throughout the service:

| Status | Meaning |
|---|---|
| 400 | The request was invalid — failed schema validation, or a supplied token/value was invalid. |
| 401 | The caller is not authenticated, or their credentials/refresh token were invalid or expired. |
| 404 | The requested resource does not exist (or, for session deletion, does not belong to the caller). |
| 409 | The request conflicts with existing state (e.g. a duplicate email/username, or an already-verified email). |
| 500 | An unexpected server error occurred. |
