const sessionService = require('../services/session.service');
const { clearAuthCookies, getRefreshTokenCookie } = require('../auth/cookies');

async function getSessions(req, res, next) {
  try {
    const sessions = await sessionService.listSessions(req.user.sub);

    res.status(200).json({
      success: true,
      data: { sessions },
    });
  } catch (err) {
    next(err);
  }
}

async function deleteSession(req, res, next) {
  try {
    const incomingRefreshToken = getRefreshTokenCookie(req);

    const { isCurrent } = await sessionService.deleteSession(req.user.sub, req.params.id, incomingRefreshToken);

    if (isCurrent) {
      clearAuthCookies(res);
    }

    res.status(200).json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

async function deleteAllOtherSessions(req, res, next) {
  try {
    const incomingRefreshToken = getRefreshTokenCookie(req);

    await sessionService.deleteAllOtherSessions(req.user.sub, incomingRefreshToken);

    res.status(200).json({
      success: true,
      message: 'All other sessions deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSessions,
  deleteSession,
  deleteAllOtherSessions,
};
