import { useState } from 'react';
import { Brand } from '../ui/Brand';
import { Button } from '../ui/Button';
import { useAuth } from '../../features/auth/AuthContext';
import { AppLink, useRouter } from '../../app/router';

const navigation = [
  { label: 'Home', href: '/' },
  { label: 'Problems', href: '/problems' },
  { label: 'Contests', href: '/contests' },
  { label: 'Leaderboard', href: '/leaderboard' },
];

export function AppShell({ children }) {
  const { user, status } = useAuth();
  const { pathname, navigate } = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <AppLink className="brand-link" to="/" aria-label="CodeArena home">
            <Brand />
          </AppLink>
          <nav className="primary-nav" aria-label="Main navigation">
            {navigation.map((item) => (
              <AppLink key={item.href} to={item.href} className={pathname === item.href ? 'nav-link nav-link--active' : 'nav-link'}>{item.label}</AppLink>
            ))}
          </nav>
          <div className="site-header__actions">{status !== 'loading' && (user ? <Button href="/profile" size="small">@{user.username}</Button> : <><AppLink className="text-link" to="/login">Log in</AppLink><Button href="/register" size="small">Join arena</Button></>)}</div>
          <button className="mobile-menu-button" type="button" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>☰</button>
        </div>
      </header>
      {menuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">{navigation.map((item) => <AppLink key={item.href} to={item.href} className={pathname === item.href ? 'nav-link nav-link--active' : 'nav-link'} onClick={() => setMenuOpen(false)}>{item.label}</AppLink>)}<hr />{user ? <button type="button" onClick={() => { setMenuOpen(false); navigate('/profile'); }}>View profile</button> : <><AppLink to="/login" onClick={() => setMenuOpen(false)}>Log in</AppLink><AppLink to="/register" onClick={() => setMenuOpen(false)}>Join arena</AppLink></>}</nav>}
      <main>{children}</main>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <Brand compact />
          <span>Build skill through deliberate practice.</span>
        </div>
      </footer>
    </div>
  );
}
