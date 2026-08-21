import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

const ACTIONS = [
  { label: 'Solve problems', href: '/problems' },
  { label: 'View profile', href: '/profile' },
  { label: 'View sessions', href: '/sessions' },
];

export function QuickActions() {
  return (
    <Card className="quick-actions">
      <h2>Quick actions</h2>
      <div className="form-actions">
        {ACTIONS.map((action) => <Button key={action.href} href={action.href} variant="secondary">{action.label}</Button>)}
      </div>
    </Card>
  );
}
