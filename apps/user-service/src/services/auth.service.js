const crypto = require('crypto');

const prisma = require('../config/prisma');
const config = require('../config/env');
const { hashPassword, comparePassword } = require('../auth/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../auth/jwt');
const { durationToMs } = require('../auth/cookies');
const { hashToken } = require('../auth/token');
const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const verificationTokenRepository = require('../repositories/verificationToken.repository');
const ApiError = require('../utils/ApiError');
const sanitizeUser = require('../utils/sanitizeUser');

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';
const INVALID_REFRESH_TOKEN_MESSAGE = 'Invalid or expired refresh token';
// Precomputed bcrypt hash with no matching plaintext, used to keep login's
// response time uniform whether or not the email exists (avoids user enumeration).
const DUMMY_PASSWORD_HASH = '$2b$12$x5mHxQ.Ur3LpLl8uUyz0veYrPxfEV3OkVu6uowgc2Nt6Hf/O5MZQ.';

function buildSessionMeta(meta = {}) {
  return {
    deviceName: meta.deviceName || null,
    browser: meta.browser || null,
    ipAddress: meta.ipAddress || null,
    userAgent: meta.userAgent || null,
  };
}

function refreshExpiryDate() {
  return new Date(Date.now() + durationToMs(config.jwt.refreshExpiresIn, 7 * 24 * 60 * 60 * 1000));
}

async function register({ username, email, password, firstName, lastName }, meta = {}) {
  const [existingEmail, existingUsername] = await Promise.all([
    userRepository.findByEmail(email),
    userRepository.findByUsername(username),
  ]);

  if (existingEmail) {
    throw new ApiError(409, 'Email is already registered');
  }

  if (existingUsername) {
    throw new ApiError(409, 'Username is already taken');
  }

  const passwordHash = await hashPassword(password);

  let user;
  let accessToken;
  let refreshToken;

  try {
    ({ user, accessToken, refreshToken } = await prisma.$transaction(async (tx) => {
      const createdUser = await userRepository.createUser(
        {
          username,
          email,
          passwordHash,
          firstName,
          lastName,
        },
        tx
      );

      await verificationTokenRepository.createVerificationToken(
        {
          userId: createdUser.id,
          token: crypto.randomBytes(32).toString('hex'),
          expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
        },
        tx
      );

      const newAccessToken = generateAccessToken({ sub: createdUser.id, role: createdUser.role });
      const newRefreshToken = generateRefreshToken({ sub: createdUser.id, role: createdUser.role });
      const refreshTokenHash = hashToken(newRefreshToken);
      const refreshExpiresAt = new Date(
        Date.now() + durationToMs(config.jwt.refreshExpiresIn, 7 * 24 * 60 * 60 * 1000)
      );

      await sessionRepository.createSession(
        {
          userId: createdUser.id,
          refreshTokenHash,
          deviceName: meta.deviceName || null,
          browser: meta.browser || null,
          ipAddress: meta.ipAddress || null,
          userAgent: meta.userAgent || null,
          expiresAt: refreshExpiresAt,
        },
        tx
      );

      return { user: createdUser, accessToken: newAccessToken, refreshToken: newRefreshToken };
    }));
  } catch (err) {
    if (err.code === 'P2002') {
      const target = err.meta?.target || [];
      const field = target.includes('email') ? 'Email' : 'Username';
      throw new ApiError(409, `${field} is already registered`);
    }
    throw err;
  }

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

async function login({ email, password }, meta = {}) {
  const user = await userRepository.findByEmail(email);
  const isPasswordValid = await comparePassword(password, user?.passwordHash || DUMMY_PASSWORD_HASH);

  if (!user || !isPasswordValid) {
    throw new ApiError(401, INVALID_CREDENTIALS_MESSAGE);
  }

  const accessToken = generateAccessToken({ sub: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ sub: user.id, role: user.role });
  const refreshTokenHash = hashToken(refreshToken);

  await sessionRepository.createSession({
    userId: user.id,
    refreshTokenHash,
    expiresAt: refreshExpiryDate(),
    ...buildSessionMeta(meta),
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

async function refreshSession(incomingRefreshToken, meta = {}) {
  if (!incomingRefreshToken) {
    throw new ApiError(401, INVALID_REFRESH_TOKEN_MESSAGE);
  }

  let payload;
  try {
    payload = verifyRefreshToken(incomingRefreshToken);
  } catch (err) {
    throw new ApiError(401, INVALID_REFRESH_TOKEN_MESSAGE);
  }

  const incomingHash = hashToken(incomingRefreshToken);
  const matchedSession = await sessionRepository.findByUserIdAndHash(payload.sub, incomingHash);

  if (!matchedSession) {
    throw new ApiError(401, INVALID_REFRESH_TOKEN_MESSAGE);
  }

  if (matchedSession.expiresAt < new Date()) {
    await sessionRepository.deleteById(matchedSession.id);
    throw new ApiError(401, INVALID_REFRESH_TOKEN_MESSAGE);
  }

  const newAccessToken = generateAccessToken({ sub: payload.sub, role: payload.role });
  const newRefreshToken = generateRefreshToken({ sub: payload.sub, role: payload.role });
  const newRefreshTokenHash = hashToken(newRefreshToken);

  await sessionRepository.updateSession(matchedSession.id, {
    refreshTokenHash: newRefreshTokenHash,
    expiresAt: refreshExpiryDate(),
    ipAddress: meta.ipAddress || matchedSession.ipAddress,
    userAgent: meta.userAgent || matchedSession.userAgent,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

async function logout(userId, incomingRefreshToken) {
  if (!incomingRefreshToken) {
    return;
  }

  const matchedSession = await sessionRepository.findByUserIdAndHash(userId, hashToken(incomingRefreshToken));

  if (matchedSession) {
    await sessionRepository.deleteById(matchedSession.id);
  }
}

async function logoutAll(userId) {
  await sessionRepository.deleteAllByUserId(userId);
}

module.exports = {
  register,
  login,
  refreshSession,
  logout,
  logoutAll,
};
