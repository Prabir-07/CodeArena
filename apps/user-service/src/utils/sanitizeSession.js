const pickFields = require('./pickFields');

const SESSION_FIELDS = ['id', 'deviceName', 'browser', 'ipAddress', 'userAgent', 'createdAt', 'expiresAt'];

function sanitizeSession(session) {
  return pickFields(session, SESSION_FIELDS);
}

module.exports = sanitizeSession;
