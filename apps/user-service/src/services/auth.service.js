const prisma = require('../config/prisma');
const config = require('../config/env');
const { hashPassword, comparePassword } = require('../auth/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../auth/jwt');
const { durationToMs } = require('../auth/cookies');
const { generateToken, hashToken } = require('../auth/token');
const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const verificationTokenRepository = require('../repositories/verificationToken.repository');
const passwordResetTokenRepository = require('../repositories/passwordResetToken.repository');
const emailService = require('../emails/email.service');
const ApiError = require('../utils/ApiError');
const sanitizeUser = require('../utils/sanitizeUser');

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';
const INVALID_REFRESH_TOKEN_MESSAGE = 'Invalid or expired refresh token';
const INVALID_VERIFICATION_TOKEN_MESSAGE = 'Invalid or expired verification token';
const INVALID_RESET_TOKEN_MESSAGE = 'Invalid or expired reset token';
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
  let verificationToken;

  try {
    ({ user, accessToken, refreshToken, verificationToken } = await prisma.$transaction(async (tx) => {
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

      // Raw token is kept in memory only long enough to hash it for storage and to
      // hand back to the caller — the future email service needs this exact value
      // to send the verification link, so it shouldn't have to be re-derived.
      const rawVerificationToken = generateToken();
      await verificationTokenRepository.createVerificationToken(
        {
          userId: createdUser.id,
          tokenHash: hashToken(rawVerificationToken),
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

      return {
        user: createdUser,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        verificationToken: rawVerificationToken,
      };
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
    // Not part of the HTTP response — reserved for the future email service
    // to send the verification link without re-generating/re-hashing a token.
    verificationToken,
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

async function verifyEmail(rawToken) {
  const tokenHash = hashToken(rawToken);
  const record = await verificationTokenRepository.findByHash(tokenHash);

  if (!record) {
    throw new ApiError(400, INVALID_VERIFICATION_TOKEN_MESSAGE);
  }

  if (record.expiresAt < new Date()) {
    await verificationTokenRepository.deleteById(record.id);
    throw new ApiError(400, INVALID_VERIFICATION_TOKEN_MESSAGE);
  }

  await prisma.$transaction(async (tx) => {
    await userRepository.updateUser(record.userId, { isEmailVerified: true }, tx);
    await verificationTokenRepository.deleteById(record.id, tx);
  });
}

async function resendVerification(userId) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.isEmailVerified) {
    throw new ApiError(409, 'Email is already verified');
  }

  const rawVerificationToken = generateToken();

  await prisma.$transaction(async (tx) => {
    await verificationTokenRepository.deleteAllByUserId(userId, tx);
    await verificationTokenRepository.createVerificationToken(
      {
        userId,
        tokenHash: hashToken(rawVerificationToken),
        expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      },
      tx
    );
  });

  await emailService.sendVerificationEmail({
    to: user.email,
    firstName: user.firstName,
    token: rawVerificationToken,
  });
}

async function forgotPassword(email) {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    return;
  }

  const rawResetToken = generateToken();

  await prisma.$transaction(async (tx) => {
    await passwordResetTokenRepository.deleteAllByUserId(user.id, tx);
    await passwordResetTokenRepository.createPasswordResetToken(
      {
        userId: user.id,
        tokenHash: hashToken(rawResetToken),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
      },
      tx
    );
  });

  await emailService.sendPasswordResetEmail({
    to: user.email,
    firstName: user.firstName,
    token: rawResetToken,
  });
}

async function resetPassword(rawToken, newPassword) {
  const tokenHash = hashToken(rawToken);
  const record = await passwordResetTokenRepository.findByHash(tokenHash);

  if (!record) {
    throw new ApiError(400, INVALID_RESET_TOKEN_MESSAGE);
  }

  if (record.expiresAt < new Date()) {
    await passwordResetTokenRepository.deleteById(record.id);
    throw new ApiError(400, INVALID_RESET_TOKEN_MESSAGE);
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction(async (tx) => {
    await userRepository.updateUser(record.userId, { passwordHash }, tx);
    await sessionRepository.deleteAllByUserId(record.userId, tx);
    await passwordResetTokenRepository.deleteById(record.id, tx);
  });
}

function issueTokens(user) {
  const accessToken = generateAccessToken({ sub: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ sub: user.id, role: user.role });
  return { accessToken, refreshToken };
}

async function persistSession(userId, refreshToken, meta, client) {
  await sessionRepository.createSession(
    {
      userId,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiryDate(),
      ...buildSessionMeta(meta),
    },
    client
  );
}

function sanitizeUsernameBase(input) {
  const cleaned = (input || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
  return cleaned.length >= 3 ? cleaned : `user${cleaned}`;
}

// Derives a username from an email/name hint, retrying with a random suffix on
// collision. Bounded attempts + a fully-random fallback guarantee this always
// terminates with something unique, without ever touching request validation.
async function generateUniqueUsername(hint, client) {
  const base = sanitizeUsernameBase(hint);
  let candidate = base;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await userRepository.findByUsername(candidate, client);
    if (!existing) {
      return candidate;
    }
    candidate = `${base}_${generateToken(3)}`.slice(0, 30);
  }

  return `user_${generateToken(8)}`.slice(0, 30);
}

async function loginWithGoogle(profile, meta = {}) {
  const { email, firstName, lastName, avatar } = profile;

  if (!email) {
    throw new ApiError(400, 'Google account did not provide an email address');
  }

  const existingUser = await userRepository.findByEmail(email);

  if (existingUser) {
    const { accessToken, refreshToken } = issueTokens(existingUser);
    await persistSession(existingUser.id, refreshToken, meta);
    return { user: sanitizeUser(existingUser), accessToken, refreshToken };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const username = await generateUniqueUsername(email.split('@')[0], tx);
      const createdUser = await userRepository.createUser(
        {
          username,
          email,
          passwordHash: null,
          firstName,
          lastName,
          avatar,
          isEmailVerified: true,
        },
        tx
      );

      const tokens = issueTokens(createdUser);
      await persistSession(createdUser.id, tokens.refreshToken, meta, tx);

      return { user: createdUser, ...tokens };
    });

    return {
      user: sanitizeUser(result.user),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  } catch (err) {
    if (err.code !== 'P2002') {
      throw err;
    }

    // Lost a race against a concurrent signup for the same email — fall back to a normal login.
    const racedUser = await userRepository.findByEmail(email);
    if (!racedUser) {
      throw err;
    }

    const { accessToken, refreshToken } = issueTokens(racedUser);
    await persistSession(racedUser.id, refreshToken, meta);
    return { user: sanitizeUser(racedUser), accessToken, refreshToken };
  }
}

module.exports = {
  register,
  login,
  refreshSession,
  logout,
  logoutAll,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  loginWithGoogle,
};
