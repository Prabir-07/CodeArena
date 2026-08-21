import { Card } from '../../../components/ui/Card';

const STAT_ITEMS = [
  { key: 'problemsSolved', label: 'Problems Solved' },
  { key: 'problemsAttempted', label: 'Problems Attempted' },
  { key: 'totalSubmissions', label: 'Total Submissions' },
  { key: 'currentStreakDays', label: 'Current Streak' },
];

function formatStat(key, value) {
  if (key === 'currentStreakDays') return `${value} ${value === 1 ? 'day' : 'days'}`;
  return value.toLocaleString();
}

export function StatsGrid({ stats }) {
  return (
    <div className="stats-grid">
      {STAT_ITEMS.map(({ key, label }) => (
        <Card className="stat-card" key={key}>
          <p className="stat-card__label">{label}</p>
          <p className="stat-card__value">{formatStat(key, stats[key])}</p>
        </Card>
      ))}
    </div>
  );
}
