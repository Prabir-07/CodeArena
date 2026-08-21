import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { AuthProvider } from '../features/auth/AuthContext';
import { AuthPage } from '../features/auth/AuthPage';
import { HomePage } from '../features/home/HomePage';
import { ProfilePage } from '../features/profile/ProfilePage';

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  return pathname;
}

function Route() {
  const pathname = usePathname();
  if (pathname === '/login') return <AuthPage mode="login" />;
  if (pathname === '/register') return <AuthPage mode="register" />;
  if (pathname === '/profile') return <ProfilePage />;
  return <HomePage />;
}

export function App() {
  return (
    <AuthProvider>
      <AppShell><Route /></AppShell>
    </AuthProvider>
  );
}
