const express = require('express');
const helmet = require('helmet');

const requestLogger = require('./middlewares/requestLogger.middleware');
const notFound = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/error.middleware');
const healthRoutes = require('./routes/health.routes');

const app = express();

app.use(express.json());
app.use(helmet());
app.use(requestLogger);

app.use('/', healthRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
