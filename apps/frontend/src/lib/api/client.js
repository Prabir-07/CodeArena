// In development, an empty base lets requests use same-origin relative paths
// so Vite's dev proxy (vite.config.js) can forward them to the right backend
// without the browser making a cross-origin request. Set the matching
// VITE_*_SERVICE_URL to override this for production or other setups.
export const USER_SERVICE_URL =
  import.meta.env.VITE_USER_SERVICE_URL || (import.meta.env.DEV ? '' : 'http://localhost:5000');

export const PROBLEM_SERVICE_URL =
  import.meta.env.VITE_PROBLEM_SERVICE_URL || (import.meta.env.DEV ? '' : 'http://localhost:5001');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.kind = status === 0 ? 'unavailable' : status === 401 ? 'unauthorized' : status === 400 ? 'validation' : 'server';
  }
}

// One request implementation per backend, differing only in base URL, whether
// credentials travel with the request, and what to say when the service can't
// be reached. The response/error handling is shared so every service behaves
// identically from a caller's point of view.
function createRequest(baseUrl, { credentials, unavailableMessage }) {
  return async function request(path, options = {}) {
    const hasBody = options.body !== undefined;
    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        credentials,
        headers: { ...(hasBody ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
        ...options,
      });
    } catch {
      throw new ApiError(unavailableMessage, 0);
    }
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.success === false) {
      // 5xx means an unhandled server-side fault, not one of the service's
      // deliberately-thrown, user-safe ApiErrors (those always use 4xx). Its
      // message may contain internal detail (e.g. a raw database error), so
      // never show it to the user — every other status keeps its real message.
      const message = response.status >= 500 ? 'Something went wrong on our end. Please try again later.' : body?.message || 'Something went wrong. Please try again.';
      throw new ApiError(message, response.status);
    }
    return body;
  };
}

export const request = createRequest(USER_SERVICE_URL, {
  credentials: 'include',
  unavailableMessage: 'The account service is unavailable.',
});

// The public Problem Service endpoints require no authentication, so this
// deliberately sends no cookies — there is nothing for the Problem Service to
// do with a User Service session, and it should never receive one.
export const problemRequest = createRequest(PROBLEM_SERVICE_URL, {
  credentials: 'omit',
  unavailableMessage: 'The problem service is unavailable.',
});
