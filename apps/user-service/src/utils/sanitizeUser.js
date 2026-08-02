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
  const safeUser = {};

  for (const field of PUBLIC_USER_FIELDS) {
    if (field in user) {
      safeUser[field] = user[field];
    }
  }

  return safeUser;
}

module.exports = sanitizeUser;
