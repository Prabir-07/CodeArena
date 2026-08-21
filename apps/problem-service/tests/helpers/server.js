require('./env');

const { once } = require('node:events');
const app = require('../../src/app');

// Boots the real Express app (the same module server.js serves) on an
// ephemeral port and returns a small request helper. Using the real app over
// real HTTP keeps middleware ordering, helmet, body parsing and error
// handling in the path being tested — none of which a direct controller call
// would exercise.
async function startServer() {
  const server = app.listen(0);
  await once(server, 'listening');

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  async function request(method, routePath, { token, internalSecret, body, headers = {} } = {}) {
    const requestHeaders = { ...headers };

    // fetch throws outright if a GET/HEAD carries a body. The auth matrices
    // below send the same payload across every method, so the body is dropped
    // here rather than requiring each caller to special-case it.
    const allowsBody = !['GET', 'HEAD'].includes(method.toUpperCase());
    const sendBody = body !== undefined && allowsBody;

    if (sendBody) requestHeaders['Content-Type'] = 'application/json';
    if (token) requestHeaders.Authorization = `Bearer ${token}`;
    if (internalSecret !== undefined) requestHeaders['X-Internal-Service-Token'] = internalSecret;

    const response = await fetch(`${baseUrl}${routePath}`, {
      method,
      headers: requestHeaders,
      body: sendBody ? JSON.stringify(body) : undefined,
    });

    const raw = await response.text();
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Left null: a few tests assert on the raw text of a non-JSON response.
    }

    return { status: response.status, body: parsed, raw, headers: response.headers };
  }

  return {
    baseUrl,
    request,
    get: (routePath, options) => request('GET', routePath, options),
    post: (routePath, options) => request('POST', routePath, options),
    patch: (routePath, options) => request('PATCH', routePath, options),
    put: (routePath, options) => request('PUT', routePath, options),
    delete: (routePath, options) => request('DELETE', routePath, options),
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

module.exports = { startServer };
