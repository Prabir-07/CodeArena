import { AppLink } from '../../../app/router';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/states/States';
import { Table } from '../../../components/ui/Table';
import { verdictTone } from '../../../lib/api/judgeService';

const LANGUAGE_LABEL = { javascript: 'JavaScript', python: 'Python', cpp: 'C++', java: 'Java' };

export function RecentSubmissions({ submissions }) {
  return (
    <Card className="recent-submissions">
      <h2>Recent submissions</h2>
      {submissions.length === 0 ? (
        <EmptyState title="No submissions yet">Solve a problem to see your submissions here.</EmptyState>
      ) : (
        <Table columns={['Problem', 'Language', 'Verdict', 'Runtime', 'Memory', 'Submitted']} caption="Your most recent CodeArena submissions (development data)">
          {submissions.map((submission) => (
            <tr key={submission.id}>
              <td><AppLink to={`/problems/${submission.problemSlug}`}>{submission.problemTitle}</AppLink></td>
              <td>{LANGUAGE_LABEL[submission.languageId] || submission.languageId}</td>
              <td><Badge tone={verdictTone(submission.verdict)}>{submission.verdict}</Badge></td>
              <td>{submission.executionTimeMs} ms</td>
              <td>{(submission.memoryKb / 1024).toFixed(1)} MB</td>
              <td>{new Date(submission.submittedAt).toLocaleString()}</td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}
