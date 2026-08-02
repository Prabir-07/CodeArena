const pickFields = require('./pickFields');

// Stricter than sanitizeUser: this is for OTHER users viewing a profile, so it
// additionally drops email, role, and isEmailVerified on top of passwordHash.
const PUBLIC_PROFILE_FIELDS = [
  'id',
  'username',
  'firstName',
  'lastName',
  'avatar',
  'bio',
  'country',
  'college',
  'githubUrl',
  'linkedinUrl',
  'portfolioUrl',
  'createdAt',
];

function sanitizePublicUser(user) {
  return pickFields(user, PUBLIC_PROFILE_FIELDS);
}

module.exports = sanitizePublicUser;
