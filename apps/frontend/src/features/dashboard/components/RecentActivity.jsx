import { AppLink } from '../../../app/router';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/states/States';

const ACTIVITY_COPY = {
  solved: (item) => <>Solved <AppLink to={`/problems/${item.problemSlug}`}>{item.problemTitle}</AppLink></>,
  submitted: (item) => <>Submitted a solution for <AppLink to={`/problems/${item.problemSlug}`}>{item.problemTitle}</AppLink></>,
  attempted: (item) => <>Attempted <AppLink to={`/problems/${item.problemSlug}`}>{item.problemTitle}</AppLink></>,
  streak: (item) => <>{item.detail}</>,
};

export function RecentActivity({ activity }) {
  return (
    <Card className="recent-activity">
      <h2>Recent activity</h2>
      {activity.length === 0 ? (
        <EmptyState title="No recent activity">Solve or attempt a problem to start building your activity feed.</EmptyState>
      ) : (
        <ul className="activity-list">
          {activity.map((item) => (
            <li className={`activity-list__item activity-list__item--${item.type}`} key={item.id}>
              <span className="activity-list__copy">{ACTIVITY_COPY[item.type](item)}</span>
              <span className="activity-list__time">{new Date(item.occurredAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
