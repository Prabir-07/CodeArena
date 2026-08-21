import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../lib/api/client';
import { userService } from '../../lib/api/userService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

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
