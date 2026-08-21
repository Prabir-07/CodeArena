const morgan = require('morgan');
const config = require('../config/env');

// Logs the request line only — method, path, status, timing. Request bodies
// and headers are never logged, which is what keeps test-case content and the
// internal service token out of the logs.
//
// Silenced under test so the suite's output stays readable; behaviour in
// development and production is unchanged.
const requestLogger = morgan('dev', { skip: () => config.nodeEnv === 'test' });

module.exports = requestLogger;
