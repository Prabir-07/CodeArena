import { Brand } from '../ui/Brand';
import { Button } from '../ui/Button';
import { useAuth } from '../../features/auth/AuthContext';

const navigation = [
  { label: 'Home', href: '/' },
  { label: 'Problems', href: '/problems' },
  { label: 'Contests', href: '/contests' },
  { label: 'Leaderboard', href: '/leaderboard' },
];

export function AppShell({ children }) {
  const { user, status } = useAuth();
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <a className="brand-link" href="/" aria-label="CodeArena home">
            <Brand />
          </a>
          <nav className="primary-nav" aria-label="Main navigation">
            {navigation.map((item) => (
              <a key={item.href} href={item.href}>{item.label}</a>
            ))}
          </nav>
          <div className="site-header__actions">{status !== 'loading' && (user ? <Button href="/profile" size="small">@{user.username}</Button> : <><a className="text-link" href="/login">Log in</a><Button href="/register" size="small">Join arena</Button></>)}</div>
        </div>
      </header>
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
