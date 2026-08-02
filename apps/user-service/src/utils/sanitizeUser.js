const pickFields = require('./pickFields');

const PUBLIC_USER_FIELDS = [
  'id',
  'username',
  'email',
  'firstName',
  'lastName',
  'avatar',
  'bio',
  'country',
  'college',
  'githubUrl',
  'linkedinUrl',
  'portfolioUrl',
  'role',
  'isEmailVerified',
  'createdAt',
  'updatedAt',
];

function sanitizeUser(user) {
  return pickFields(user, PUBLIC_USER_FIELDS);
}

module.exports = sanitizeUser;
