import { Table } from '../../../components/ui/Table';
import { LeaderboardUser } from './LeaderboardUser';
import { RankCell } from './RankCell';

export function GlobalLeaderboardTable({ entries, currentUsername }) {
  return (
    <Table columns={['Rank', 'User', 'Solved', 'Rating', 'Contests']} caption="Global standings (development data)">
      {entries.map((entry) => {
        const isCurrentUser = entry.username === currentUsername;
        return (
          <tr key={entry.username} className={isCurrentUser ? 'leaderboard-row leaderboard-row--current' : 'leaderboard-row'}>
            <td><RankCell rank={entry.rank} change={entry.rankChange} /></td>
            <td><LeaderboardUser entry={entry} isCurrentUser={isCurrentUser} /></td>
            <td>{entry.problemsSolved.toLocaleString()}</td>
            <td className="leaderboard-rating">{entry.rating.toLocaleString()}</td>
            <td>{entry.contestsPlayed}</td>
          </tr>
        );
      })}
    </Table>
  );
}
