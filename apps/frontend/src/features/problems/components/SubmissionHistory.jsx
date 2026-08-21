import { EmptyState, LoadingState } from '../../../components/states/States';
import { Badge } from '../../../components/ui/Badge';
import { Table } from '../../../components/ui/Table';
import { verdictTone } from '../../../lib/api/judgeService';

const LANGUAGE_LABEL = { javascript: 'JavaScript', python: 'Python', cpp: 'C++', java: 'Java' };

export function SubmissionHistory({ loading, submissions }) {
  if (loading) return <LoadingState label="Loading submission history…" />;
  if (submissions.length === 0) {
    return <EmptyState title="No submissions yet">Run and submit your code to build a history for this problem.</EmptyState>;
  }
  return (
    <Table columns={['Status', 'Language', 'Runtime', 'Memory', 'Submitted']} caption="Your submissions for this problem (development data)">
      {submissions.map((submission) => (
        <tr key={submission.id}>
          <td><Badge tone={verdictTone(submission.verdict)}>{submission.verdict}</Badge></td>
          <td>{LANGUAGE_LABEL[submission.languageId] || submission.languageId}</td>
          <td>{submission.executionTimeMs} ms</td>
          <td>{(submission.memoryKb / 1024).toFixed(1)} MB</td>
          <td>{new Date(submission.submittedAt).toLocaleString()}</td>
        </tr>
      ))}
    </Table>
  );
}
