import { request } from './client';

export const userService = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/users/me'),
  updateMe: (data) => request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
};
