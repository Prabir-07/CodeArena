const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/ApiError');
const sanitizeUser = require('../utils/sanitizeUser');
const sanitizePublicUser = require('../utils/sanitizePublicUser');

async function getProfile(userId) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return sanitizeUser(user);
}

async function updateProfile(userId, updates) {
  try {
    const updatedUser = await userRepository.updateUser(userId, updates);
    return sanitizeUser(updatedUser);
  } catch (err) {
    if (err.code === 'P2025') {
      throw new ApiError(404, 'User not found');
    }
    throw err;
  }
}

async function getPublicProfile(username) {
  const user = await userRepository.findByUsername(username);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return sanitizePublicUser(user);
}

module.exports = {
  getProfile,
  updateProfile,
  getPublicProfile,
};
