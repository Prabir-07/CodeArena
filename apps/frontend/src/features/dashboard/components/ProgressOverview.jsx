import { Card } from '../../../components/ui/Card';

const DIFFICULTY_MODIFIER = { Easy: 'progress-row--easy', Medium: 'progress-row--medium', Hard: 'progress-row--hard' };

export function ProgressOverview({ progress }) {
  return (
    <Card className="progress-overview">
      <h2>Problem-solving progress</h2>
      <div className="progress-overview__rows">
        {progress.map(({ difficulty, solved, total }) => {
          const percent = total === 0 ? 0 : Math.round((solved / total) * 100);
          return (
            <div className={`progress-row ${DIFFICULTY_MODIFIER[difficulty] || ''}`} key={difficulty}>
              <div className="progress-row__label">
                <span>{difficulty}</span>
                <span>{solved} / {total} · {percent}%</span>
              </div>
              <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
