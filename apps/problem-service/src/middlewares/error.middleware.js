const ApiError = require('../utils/ApiError');
const config = require('../config/env');

const GENERIC_MESSAGE = 'Internal Server Error';

// An error's message is only returned to the client when we know it was
// written for a client.
//
//  - ApiError is thrown deliberately by this service's own code, so its
//    message is already user-facing and safe.
//  - http-errors (which Express and body-parser use for things like an
//    oversized body or malformed JSON) sets `expose: true` on client-caused
//    4xx and `false` on server faults — exactly the distinction needed here.
//
// Everything else — most importantly a raw Prisma error — is replaced with a
// generic message. An unhandled Prisma failure otherwise serialises its full
// diagnostic into the response: the failing query, an excerpt of this
// service's source, the absolute file path, and the database host and port.
// On a public, unauthenticated endpoint that is a genuine disclosure, not a
// theoretical one.
function isExposable(err) {
  return err instanceof ApiError || err.expose === true;
}

const errorHandler = (err, req, res, next) => {
  const rawStatus = err.statusCode || err.status || 500;
  const statusCode = Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus <= 599 ? rawStatus : 500;

  // Anything this service did not throw on purpose is logged in full here, so
  // sanitising the response never costs debuggability — the detail moves to
  // the server log instead of the wire. Silenced under test, where several
  // cases deliberately provoke errors.
  if (!(err instanceof ApiError) && config.nodeEnv !== 'test') {
    console.error('[problem-service] unhandled error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message: isExposable(err) ? err.message || GENERIC_MESSAGE : GENERIC_MESSAGE,
  });
};

module.exports = errorHandler;
