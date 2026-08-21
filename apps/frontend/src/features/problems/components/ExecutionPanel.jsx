import { Badge } from '../../../components/ui/Badge';
import { verdictTone } from '../../../lib/api/judgeService';

export function ExecutionPanel({ execution }) {
  if (!execution || execution.status === 'idle') {
    return <p className="execution-panel__placeholder">Run your code against a test case, or submit, to see results here.</p>;
  }

  if (execution.status === 'running') {
    return (
      <div className="execution-panel execution-panel--running">
        <span className="spinner" aria-hidden="true" />
        <span>{execution.mode === 'submit' ? 'Submitting…' : 'Running…'} (development simulation)</span>
      </div>
    );
  }

  const { result } = execution;
  return (
    <div className="execution-panel">
      <div className="execution-panel__verdict">
        <Badge tone={verdictTone(result.verdict)}>{result.verdict}</Badge>
        <span className="execution-panel__mode-label">{execution.mode === 'submit' ? 'Submission result' : 'Run result'} · simulated</span>
      </div>
      {execution.mode === 'submit' && (
        <p className="execution-panel__cases">{result.testCasesPassed} / {result.testCasesTotal} test cases passed</p>
      )}
      {result.stdout && (
        <div className="execution-panel__block">
          <span>Output</span>
          <pre>{result.stdout}</pre>
        </div>
      )}
      {result.stderr && (
        <div className="execution-panel__block execution-panel__block--error">
          <span>{result.verdict === 'Compilation Error' ? 'Compiler output' : 'Stderr'}</span>
          <pre>{result.stderr}</pre>
        </div>
      )}
      {(result.executionTimeMs > 0 || result.memoryKb > 0) && (
        <p className="execution-panel__metrics">{result.executionTimeMs} ms · {(result.memoryKb / 1024).toFixed(1)} MB</p>
      )}
    </div>
  );
}
