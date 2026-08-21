import { useEffect, useState } from 'react';
import { AppLink } from '../../app/router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState, ErrorState, LoadingState } from '../../components/states/States';
import { judgeService } from '../../lib/api/judgeService';
import { ProblemNotFoundError, problemService } from '../../lib/api/problemService';
import { EditorShell } from './components/EditorShell';
import { ExecutionPanel } from './components/ExecutionPanel';
import { ProblemExamples } from './components/ProblemExamples';
import { ProblemStatement } from './components/ProblemStatement';
import { SubmissionHistory } from './components/SubmissionHistory';
import { TestCasePanel } from './components/TestCasePanel';

const DIFFICULTY_TONE = { Easy: 'success', Medium: 'warning', Hard: 'danger' };
const LANGUAGES = judgeService.getLanguages();
const PANEL_TABS = [
  { value: 'tests', label: 'Test cases' },
  { value: 'submissions', label: 'Submissions' },
];

export function SolvePage({ params }) {
  const { slug } = params;
  const [state, setState] = useState({ loading: true, problem: null, error: null });
  const [languageId, setLanguageId] = useState(LANGUAGES[0].id);
  const [codeByLanguage, setCodeByLanguage] = useState({});
  const [caseSelection, setCaseSelection] = useState('0');
  const [customInput, setCustomInput] = useState('');
  const [execution, setExecution] = useState({ mode: null, status: 'idle', result: null });
  const [panelTab, setPanelTab] = useState('tests');
  const [history, setHistory] = useState({ loading: true, submissions: [] });

  const load = () => {
    setState({ loading: true, problem: null, error: null });
    problemService
      .getProblem(slug)
      .then((problem) => setState({ loading: false, problem, error: null }))
      .catch((error) => setState({ loading: false, problem: null, error }));
  };
  useEffect(load, [slug]);

  // Once the problem loads, seed a starter-code slot for every language (kept
  // independently so switching languages never loses what was typed) and
  // reset the workspace's per-session state for the new problem.
  useEffect(() => {
    if (!state.problem) return;
    const initial = {};
    for (const language of LANGUAGES) initial[language.id] = judgeService.getStarterCode(state.problem, language.id);
    setCodeByLanguage(initial);
    setLanguageId(LANGUAGES[0].id);
    setCaseSelection('0');
    setCustomInput('');
    setExecution({ mode: null, status: 'idle', result: null });
  }, [state.problem]);

  const loadHistory = () => {
    setHistory((current) => ({ ...current, loading: true }));
    judgeService.getSubmissionHistory(slug).then((submissions) => setHistory({ loading: false, submissions }));
  };
  useEffect(loadHistory, [slug]);

  if (state.loading) {
    return (
      <section className="section-wrap content-state">
        <LoadingState label="Loading workspace…" />
      </section>
    );
  }

  if (state.error instanceof ProblemNotFoundError) {
    return (
      <section className="section-wrap content-state">
        <EmptyState title="Problem not found" action={<Button href="/problems">Back to problems</Button>}>
          We couldn't find a problem at "{slug}".
        </EmptyState>
      </section>
    );
  }

  if (state.error) {
    return (
      <section className="section-wrap content-state">
        <ErrorState onRetry={load}>{state.error.message}</ErrorState>
      </section>
    );
  }

  const { problem } = state;
  const code = codeByLanguage[languageId] ?? '';
  const setCode = (value) => setCodeByLanguage((current) => ({ ...current, [languageId]: value }));
  const resetCode = () => setCodeByLanguage((current) => ({ ...current, [languageId]: judgeService.getStarterCode(problem, languageId) }));

  const activeTestCase =
    caseSelection === 'custom'
      ? { input: customInput, expectedOutput: undefined }
      : { input: problem.examples[Number(caseSelection)].input, expectedOutput: problem.examples[Number(caseSelection)].output };

  const running = execution.status === 'running' ? execution.mode : null;

  const runCode = async () => {
    setPanelTab('tests');
    setExecution({ mode: 'run', status: 'running', result: null });
    const result = await judgeService.runCode({ languageId, code, testCase: activeTestCase });
    setExecution({ mode: 'run', status: 'done', result });
  };

  const submitCode = async () => {
    setPanelTab('tests');
    setExecution({ mode: 'submit', status: 'running', result: null });
    const result = await judgeService.submitCode({ slug, languageId, code, testCasesTotal: problem.examples.length });
    setExecution({ mode: 'submit', status: 'done', result });
    loadHistory();
  };

  return (
    <section className="solve-page">
      <header className="solve-page__header section-wrap">
        <AppLink to={`/problems/${problem.slug}`} className="text-link">← {problem.title}</AppLink>
        <div className="solve-page__header-meta">
          <Badge tone={DIFFICULTY_TONE[problem.difficulty]}>{problem.difficulty}</Badge>
          <Badge tone="neutral">Judge Service · development simulation</Badge>
        </div>
      </header>

      <div className="solve-workspace">
        <div className="solve-workspace__statement">
          <h1 className="solve-workspace__title">{problem.title}</h1>
          <ProblemStatement problem={problem} defaultOpen={false} />
          <ProblemExamples examples={problem.examples} defaultOpen={false} />
        </div>

        <div className="solve-workspace__editor">
          <EditorShell
            languages={LANGUAGES}
            languageId={languageId}
            onLanguageChange={setLanguageId}
            code={code}
            onCodeChange={setCode}
            onReset={resetCode}
            onRun={runCode}
            onSubmit={submitCode}
            running={running}
          />

          <details className="solve-workspace__panel" open>
            <summary>Test cases &amp; output</summary>
            <Tabs tabs={PANEL_TABS} value={panelTab} onChange={setPanelTab} />
            {panelTab === 'tests' ? (
              <>
                <TestCasePanel
                  examples={problem.examples}
                  selectedIndex={caseSelection}
                  onSelect={setCaseSelection}
                  customInput={customInput}
                  onCustomInputChange={setCustomInput}
                />
                <ExecutionPanel execution={execution} />
              </>
            ) : (
              <SubmissionHistory loading={history.loading} submissions={history.submissions} />
            )}
          </details>
        </div>
      </div>
    </section>
  );
}
