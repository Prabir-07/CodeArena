import { useAuth } from '../../features/auth/AuthContext';

// Small gate for pages that need a signed-in user, without pulling in a
// routing library. Callers keep full control of their own loading/logged-out
// markup so existing unauthenticated UX doesn't change.
export function RequireAuth({ children, loading, fallback }) {
  const { user, status } = useAuth();
  if (status === 'loading') return loading;
  if (!user) return fallback;
  return children;
}
