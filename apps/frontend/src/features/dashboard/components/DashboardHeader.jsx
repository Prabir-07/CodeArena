import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';

export function DashboardHeader({ user }) {
  const displayName = user.firstName || user.username;
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__identity">
        <Avatar name={displayName} src={user.avatar} className="dashboard-avatar" />
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
