export const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:5000';

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
  if (!response.ok || body?.success === false) throw new ApiError(body?.message || 'Something went wrong. Please try again.', response.status);
  return body;
}
