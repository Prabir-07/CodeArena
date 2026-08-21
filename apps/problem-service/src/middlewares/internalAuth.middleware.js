const crypto = require('crypto');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

// Service-to-service credential, deliberately NOT the user JWT path. A stolen
// user access token — even an admin's — must not be able to reach hidden test
// cases, and the Judge Service has no user identity to present in the first
// place. Node lowercases incoming header names.
const INTERNAL_SERVICE_HEADER = 'x-internal-service-token';

function safeEqual(provided, expected) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  // timingSafeEqual throws on length mismatch, so that case is handled first.
  // The length comparison itself is not constant-time, which is accepted: it
  // reveals only the secret's length, not its content.
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

function internalAuth(req, res, next) {
  const provided = req.headers[INTERNAL_SERVICE_HEADER];
  const expected = config.internalServiceSecret;

  // Fails closed when the secret is not configured, so a missing environment
  // variable can never degrade into "no credential required". A repeated
  // header arrives as an array, which the typeof check rejects.
  //
  // Every failure mode returns the same 403 with the same message: a caller
  // cannot distinguish "no secret sent" from "wrong secret" from "server has
  // no secret configured", so this endpoint gives away nothing.
  if (!expected || typeof provided !== 'string' || !safeEqual(provided, expected)) {
    return next(new ApiError(403, 'Forbidden'));
  }

  return next();
}

module.exports = internalAuth;
