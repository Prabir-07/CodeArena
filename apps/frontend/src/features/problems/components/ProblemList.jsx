import { AppLink } from '../../../app/router';
import { Badge } from '../../../components/ui/Badge';
import { Table } from '../../../components/ui/Table';

const DIFFICULTY_TONE = { Easy: 'success', Medium: 'warning', Hard: 'danger' };
const STATUS_LABEL = { solved: 'Solved', attempted: 'Attempted', todo: 'Todo' };
const STATUS_TONE = { solved: 'success', attempted: 'warning', todo: 'neutral' };

export function ProblemList({ problems }) {
  return (
    <Table columns={['Problem', 'Difficulty', 'Tags', 'Acceptance', 'Status']} caption="Practice problems">
      {problems.map((problem) => (
        <tr key={problem.slug}>
          <td>
            <AppLink to={`/problems/${problem.slug}`} className="problem-list__title">{problem.title}</AppLink>
            <p className="problem-list__summary">{problem.summary}</p>
          </td>
          <td><Badge tone={DIFFICULTY_TONE[problem.difficulty]}>{problem.difficulty}</Badge></td>
          <td className="problem-list__tags">{problem.tags.map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}</td>
          <td>{problem.acceptanceRate.toFixed(1)}%</td>
          <td><Badge tone={STATUS_TONE[problem.status]}>{STATUS_LABEL[problem.status]}</Badge></td>
        </tr>
      ))}
    </Table>
  );
}
