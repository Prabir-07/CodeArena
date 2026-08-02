const sessionRepository = require('../repositories/session.repository');
const { hashToken } = require('../auth/token');
const ApiError = require('../utils/ApiError');
const sanitizeSession = require('../utils/sanitizeSession');

async function listSessions(userId) {
  const sessions = await sessionRepository.findByUserId(userId);
  return sessions.map(sanitizeSession);
}

async function deleteSession(userId, sessionId, incomingRefreshToken) {
  const session = await sessionRepository.findById(sessionId);

  if (!session || session.userId !== userId) {
    throw new ApiError(404, 'Session not found');
  }

  const isCurrent = Boolean(incomingRefreshToken) && session.refreshTokenHash === hashToken(incomingRefreshToken);

  await sessionRepository.deleteByIdForUser(sessionId, userId);

  return { isCurrent };
}

async function deleteAllOtherSessions(userId, incomingRefreshToken) {
  if (!incomingRefreshToken) {
    throw new ApiError(400, 'Current session could not be identified');
  }

  const currentSession = await sessionRepository.findByUserIdAndHash(userId, hashToken(incomingRefreshToken));

  if (!currentSession) {
    throw new ApiError(400, 'Current session could not be identified');
  }

  await sessionRepository.deleteAllByUserIdExcept(userId, currentSession.id);
}

module.exports = {
  listSessions,
  deleteSession,
  deleteAllOtherSessions,
};
