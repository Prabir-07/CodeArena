import { Table } from '../../../components/ui/Table';
import { LeaderboardUser } from './LeaderboardUser';
import { RankCell } from './RankCell';

export function ContestLeaderboardTable({ entries, currentUsername }) {
  return (
    <Table columns={['Rank', 'User', 'Score', 'Solved', 'Penalty']} caption="Contest standings (development data)">
      {entries.map((entry) => {
        const isCurrentUser = entry.username === currentUsername;
        return (
          <tr key={entry.username} className={isCurrentUser ? 'leaderboard-row leaderboard-row--current' : 'leaderboard-row'}>
            <td><RankCell rank={entry.rank} /></td>
            <td><LeaderboardUser entry={entry} isCurrentUser={isCurrentUser} /></td>
            <td className="leaderboard-rating">{entry.score.toLocaleString()}<span className="leaderboard-of"> / {entry.maxScore.toLocaleString()}</span></td>
            <td>{entry.solved} / {entry.totalProblems}</td>
            <td>{entry.penaltyMinutes === 0 ? '—' : `${entry.penaltyMinutes} min`}</td>
          </tr>
        );
      })}
    </Table>
  );
}
