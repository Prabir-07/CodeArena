const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');

const requestLogger = require('./middlewares/requestLogger.middleware');
const notFound = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/error.middleware');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(passport.initialize());
app.use(requestLogger);

app.use('/', healthRoutes);
app.use('/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
