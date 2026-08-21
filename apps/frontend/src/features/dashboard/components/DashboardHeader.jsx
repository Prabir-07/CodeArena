import { Button } from '../../../components/ui/Button';

export function DashboardHeader({ user }) {
  const displayName = user.firstName || user.username;
  const initial = displayName.charAt(0).toUpperCase();
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__identity">
        {user.avatar ? (
          <img src={user.avatar} alt="" className="dashboard-avatar" />
        ) : (
          <span className="dashboard-avatar dashboard-avatar--fallback" aria-hidden="true">{initial}</span>
        )}
        <div>
          <p className="eyebrow">YOUR DASHBOARD</p>
          <h1>Welcome back, {displayName}.</h1>
          <p>Here's where your CodeArena progress stands today.</p>
        </div>
      </div>
      <Button href="/profile" variant="secondary">View profile</Button>
    </header>
  );
}
