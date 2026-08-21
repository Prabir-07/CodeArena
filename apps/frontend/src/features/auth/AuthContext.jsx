import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../lib/api/client';
import { userService } from '../../lib/api/userService';
import { useToast } from '../../components/ui/Toast';

const AuthContext = createContext(null);

// The User Service's Google OAuth callback redirects here with ?auth=success
// or ?auth=failure after setting (or failing to set) auth cookies. This just
// surfaces that outcome and cleans up the URL — the normal getMe()/refresh()
// bootstrap below is what actually picks up the resulting session.
function useGoogleAuthRedirectNotice(notify) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get('auth');
    if (!auth) return;
    if (auth === 'success') notify('Signed in with Google successfully.', 'success');
    else if (auth === 'failure') notify('Google sign-in failed. Please try again.', 'error');
    params.delete('auth');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
    // Runs once on mount to consume the redirect's query param exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const { notify } = useToast();
  useGoogleAuthRedirectNotice(notify);

  const loadUser = useCallback(async () => {
    try {
      const response = await userService.getMe();
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        try {
          await userService.refresh();
          const response = await userService.getMe();
          setUser(response.data.user);
          return response.data.user;
        } catch {
          setUser(null);
        }
      } else throw error;
      return null;
    }
  }, []);

  useEffect(() => {
    loadUser().catch(() => setUser(null)).finally(() => setStatus('ready'));
  }, [loadUser]);

  const value = useMemo(() => ({
    user, status, login: async (data) => { const result = await userService.login(data); setUser(result.data.user); return result; },
    register: async (data) => { const result = await userService.register(data); setUser(result.data.user); return result; },
    logout: async () => { await userService.logout(); setUser(null); },
    refreshUser: loadUser,
    updateUser: async (data) => { const result = await userService.updateMe(data); setUser(result.data.user); return result.data.user; },
  }), [user, status, loadUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
