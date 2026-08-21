import { Badge } from '../../../components/ui/Badge';
import { Table } from '../../../components/ui/Table';

const DIFFICULTY_TONE = { Easy: 'success', Medium: 'warning', Hard: 'danger' };

export function ContestProblemList({ problems }) {
  return (
    <Table columns={['#', 'Problem', 'Difficulty', 'Points']} caption="Problems in this contest">
      {problems.map((entry, index) => (
        <tr key={entry.slug}>
          <td>{String.fromCharCode(65 + index)}</td>
          <td>{entry.problem.title}</td>
          <td><Badge tone={DIFFICULTY_TONE[entry.problem.difficulty]}>{entry.problem.difficulty}</Badge></td>
          <td>{entry.points}</td>
        </tr>
      ))}
    </Table>
  );
}
