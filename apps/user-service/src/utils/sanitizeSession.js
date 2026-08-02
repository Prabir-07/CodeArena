const SESSION_FIELDS = ['id', 'deviceName', 'browser', 'ipAddress', 'userAgent', 'createdAt', 'expiresAt'];

function sanitizeSession(session) {
  const safeSession = {};

  for (const field of SESSION_FIELDS) {
    if (field in session) {
      safeSession[field] = session[field];
    }
  }

  return safeSession;
}

module.exports = sanitizeSession;
