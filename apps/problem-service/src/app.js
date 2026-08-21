const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const requestLogger = require('./middlewares/requestLogger.middleware');
const notFound = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/error.middleware');
const healthRoutes = require('./routes/health.routes');
const problemRoutes = require('./routes/problem.routes');
const adminProblemRoutes = require('./routes/adminProblem.routes');
const internalRoutes = require('./routes/internal.routes');

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cookieParser());
app.use(requestLogger);

app.use('/', healthRoutes);
app.use('/admin/problems', adminProblemRoutes);
app.use('/internal', internalRoutes);
app.use('/', problemRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
