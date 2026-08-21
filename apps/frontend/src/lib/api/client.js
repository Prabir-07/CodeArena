// In development, an empty base lets requests use same-origin relative paths
// so Vite's dev proxy (vite.config.js) can forward them to the User Service
// without the browser making a cross-origin, cookie-bearing request. Set
// VITE_USER_SERVICE_URL to override this for production or other setups.
export const USER_SERVICE_URL =
  import.meta.env.VITE_USER_SERVICE_URL || (import.meta.env.DEV ? '' : 'http://localhost:5000');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.kind = status === 0 ? 'unavailable' : status === 401 ? 'unauthorized' : status === 400 ? 'validation' : 'server';
  }
}

export async function request(path, options = {}) {
  const hasBody = options.body !== undefined;
  let response;
  try {
    response = await fetch(`${USER_SERVICE_URL}${path}`, {
      credentials: 'include',
      headers: { ...(hasBody ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
      ...options,
    });
  } catch {
    throw new ApiError('The account service is unavailable.', 0);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success === false) {
    // 5xx means an unhandled server-side fault, not one of the User Service's
    // deliberately-thrown, user-safe ApiErrors (those always use 4xx). Its
    // message may contain internal detail (e.g. a raw database error), so
    // never show it to the user — every other status keeps its real message.
    const message = response.status >= 500 ? 'Something went wrong on our end. Please try again later.' : body?.message || 'Something went wrong. Please try again.';
    throw new ApiError(message, response.status);
  }
  return body;
}
