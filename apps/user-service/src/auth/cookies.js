const config = require('../config/env');

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';

const DURATION_UNIT_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

function durationToMs(duration, fallbackMs) {
  const match = /^(\d+)(s|m|h|d)$/.exec(String(duration).trim());
  if (!match) return fallbackMs;
  const [, amount, unit] = match;
  return Number(amount) * DURATION_UNIT_MS[unit];
}

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
  };
}

function setAuthCookies(res, { accessToken, refreshToken }) {
  if (accessToken) {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...baseCookieOptions(),
      maxAge: durationToMs(config.jwt.accessExpiresIn, 15 * 60 * 1000),
    });
  }

  if (refreshToken) {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...baseCookieOptions(),
      maxAge: durationToMs(config.jwt.refreshExpiresIn, 7 * 24 * 60 * 60 * 1000),
    });
  }
}

function clearAuthCookies(res) {
  const options = baseCookieOptions();
  res.clearCookie(ACCESS_TOKEN_COOKIE, options);
  res.clearCookie(REFRESH_TOKEN_COOKIE, options);
}

module.exports = {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
  clearAuthCookies,
};
