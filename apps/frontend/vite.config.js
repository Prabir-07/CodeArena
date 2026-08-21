import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only: the User Service (apps/user-service) runs on this port and sets
// httpOnly cookies. Proxying same-origin here (instead of fetching it
// cross-origin from the browser) avoids the CORS/credentials conflict that
// cross-site cookie requests would otherwise hit. This has no effect on the
// production build output.
const USER_SERVICE_PROXY_TARGET = 'http://localhost:5000';

// Dev-only: the Problem Service (apps/problem-service) runs on this port. Its
// public endpoints need no cookies, but proxying same-origin keeps the browser
// off a cross-origin request and matches how the User Service is wired.
const PROBLEM_SERVICE_PROXY_TARGET = 'http://localhost:5001';

// /sessions, /users/:username and /problems are also client-side routes (see
// src/app/App.jsx), so a real browser navigation to them (direct URL,
// refresh, bookmark) must fall through to the SPA rather than being proxied
// to the backend's same-named API routes — only the app's own fetch()
// calls should be proxied. Browser navigations send `Accept: text/html`;
// fetch() in src/lib/api/client.js does not, so that header reliably tells
// the two apart. /auth has no such SPA route (e.g. the Google OAuth link at
// /auth/google is a real full-page navigation that must always reach the
// backend), and neither does /tags, so those are proxied unconditionally.
function bypassPageNavigation(req) {
  if (req.headers.accept?.includes('text/html')) return req.url;
}

export default defineConfig({
  plugins: [react()],
  server: {
    // Matches the User Service's configured FRONTEND_URL so the Google OAuth
    // redirect (?auth=success|failure) lands back on this dev server.
    port: 3000,
    proxy: {
      '/auth': { target: USER_SERVICE_PROXY_TARGET, changeOrigin: true },
      '/users': { target: USER_SERVICE_PROXY_TARGET, changeOrigin: true, bypass: bypassPageNavigation },
      '/sessions': { target: USER_SERVICE_PROXY_TARGET, changeOrigin: true, bypass: bypassPageNavigation },
      '/problems': { target: PROBLEM_SERVICE_PROXY_TARGET, changeOrigin: true, bypass: bypassPageNavigation },
      '/tags': { target: PROBLEM_SERVICE_PROXY_TARGET, changeOrigin: true },
    },
  },
});
