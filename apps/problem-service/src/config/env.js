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
};
