import { AppLink } from '../../../app/router';
import { Badge } from '../../../components/ui/Badge';
import { Table } from '../../../components/ui/Table';

const DIFFICULTY_TONE = { Easy: 'success', Medium: 'warning', Hard: 'danger' };

// The Acceptance and Status columns were dropped when this list moved onto the
// real Problem Service. Both are submission-derived — acceptance rate is an
// aggregate over submissions, and status is per-user solved/attempted/todo —
// so the Problem Service does not own either, and the catalogue is now
// open-ended (an admin can author problems that no mock table describes).
// There is no honest value to show until a Judge Service exists.
export function ProblemList({ problems }) {
  return (
    <Table columns={['Problem', 'Difficulty', 'Tags']} caption="Practice problems">
      {problems.map((problem) => (
        <tr key={problem.slug}>
          <td>
            <AppLink to={`/problems/${problem.slug}`} className="problem-list__title">{problem.title}</AppLink>
            <p className="problem-list__summary">{problem.summary}</p>
          </td>
          <td><Badge tone={DIFFICULTY_TONE[problem.difficulty]}>{problem.difficulty}</Badge></td>
          <td className="problem-list__tags">{problem.tags.map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}</td>
        </tr>
      ))}
    </Table>
  );
}
