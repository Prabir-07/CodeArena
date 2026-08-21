import { request, USER_SERVICE_URL } from './client';

export const userService = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/users/me'),
  updateMe: (data) => request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  getPublicProfile: (username) => request(`/users/${encodeURIComponent(username)}`),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, newPassword) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
  verifyEmail: (token) => request('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
  resendVerification: () => request('/auth/resend-verification', { method: 'POST' }),
  getSessions: () => request('/sessions'),
  deleteSession: (id) => request(`/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  deleteOtherSessions: () => request('/sessions', { method: 'DELETE' }),
  logoutAll: () => request('/auth/logout-all', { method: 'POST' }),
  googleUrl: `${USER_SERVICE_URL}/auth/google`,
};
