require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    // Must match the User Service's JWT_ACCESS_SECRET exactly — this service
    // verifies the same tokens User Service issues, independently, without
    // calling back to it.
    accessSecret: process.env.JWT_ACCESS_SECRET,
  },
  // Shared only with the Judge Service, for the /internal routes. Separate
  // from the JWT secret on purpose: user tokens must not grant access to
  // hidden test cases, and vice versa.
  internalServiceSecret: process.env.INTERNAL_SERVICE_SECRET,
};
