const app = require('./app');
const config = require('./config/env');

app.listen(config.port, () => {
  console.log(`problem-service listening on port ${config.port} [${config.nodeEnv}]`);
});
