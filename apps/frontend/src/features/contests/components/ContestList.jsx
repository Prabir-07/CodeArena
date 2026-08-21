import { AppLink } from '../../../app/router';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { statusTone } from '../../../lib/api/contestService';

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function ContestList({ contests }) {
  return (
    <div className="contests-grid">
      {contests.map((contest) => (
        <Card as="article" className="contest-card" key={contest.slug}>
          <div className="contest-card__header">
            <Badge tone={statusTone(contest.status)}>{contest.status}</Badge>
          </div>
          <h2><AppLink to={`/contests/${contest.slug}`}>{contest.title}</AppLink></h2>
          <p className="contest-card__description">{contest.description}</p>
          <dl className="contest-card__stats">
            <div><dt>Starts</dt><dd>{new Date(contest.startTime).toLocaleString()}</dd></div>
            <div><dt>Duration</dt><dd>{formatDuration(contest.durationMinutes)}</dd></div>
            <div><dt>{contest.status === 'Upcoming' ? 'Registered' : 'Participants'}</dt><dd>{contest.participantCount.toLocaleString()}</dd></div>
            <div><dt>Problems</dt><dd>{contest.problemCount}</dd></div>
          </dl>
          <AppLink to={`/contests/${contest.slug}`} className="contest-card__link">View contest →</AppLink>
        </Card>
      ))}
    </div>
  );
}
