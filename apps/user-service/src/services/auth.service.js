const crypto = require('crypto');

const prisma = require('../config/prisma');
const config = require('../config/env');
const { hashPassword } = require('../auth/password');
const { generateAccessToken, generateRefreshToken } = require('../auth/jwt');
const { durationToMs } = require('../auth/cookies');
const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const verificationTokenRepository = require('../repositories/verificationToken.repository');
const ApiError = require('../utils/ApiError');
const sanitizeUser = require('../utils/sanitizeUser');

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

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
      const refreshTokenHash = await hashPassword(newRefreshToken);
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

module.exports = {
  register,
};
