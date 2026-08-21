import { useEffect, useState } from 'react';
import { AppLink } from '../../app/router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState, ErrorState, LoadingState } from '../../components/states/States';
import { judgeService } from '../../lib/api/judgeService';
import { ContestNotFoundError, contestService, statusTone } from '../../lib/api/contestService';
import { EditorShell } from '../problems/components/EditorShell';
import { ExecutionPanel } from '../problems/components/ExecutionPanel';
import { ProblemExamples } from '../problems/components/ProblemExamples';
import { ProblemStatement } from '../problems/components/ProblemStatement';
import { SubmissionHistory } from '../problems/components/SubmissionHistory';
import { TestCasePanel } from '../problems/components/TestCasePanel';
import { ContestProblemNav } from './components/ContestProblemNav';

const DIFFICULTY_TONE = { Easy: 'success', Medium: 'warning', Hard: 'danger' };
const LANGUAGES = judgeService.getLanguages();
const PANEL_TABS = [
  { value: 'tests', label: 'Test cases' },
  { value: 'submissions', label: 'Submissions' },
];

export function ContestSolvePage({ params }) {
  const { slug } = params;
  const [state, setState] = useState({ loading: true, contest: null, error: null });
  const [activeIndex, setActiveIndex] = useState(0);
  const [languageId, setLanguageId] = useState(LANGUAGES[0].id);
  const [codeByKey, setCodeByKey] = useState({});
  const [caseSelection, setCaseSelection] = useState('0');
  const [customInput, setCustomInput] = useState('');
  const [execution, setExecution] = useState({ mode: null, status: 'idle', result: null });
  const [panelTab, setPanelTab] = useState('tests');
  const [history, setHistory] = useState({ loading: true, submissions: [] });

  const load = () => {
    setState({ loading: true, contest: null, error: null });
    contestService
      .getContest(slug)
      .then((contest) => setState({ loading: false, contest, error: null }))
      .catch((error) => setState({ loading: false, contest: null, error }));
  };
  useEffect(load, [slug]);

  const activeEntry = state.contest ? state.contest.problems[activeIndex] : null;
  const activeProblem = activeEntry ? activeEntry.problem : null;

  // Once the active contest problem is known, seed a starter-code slot for
  // every language — keyed by problem+language so switching between contest
  // problems or languages never loses what was typed — and reset the
  // workspace's per-problem run/submit state.
  useEffect(() => {
    if (!activeProblem) return;
    setCodeByKey((current) => {
      const next = { ...current };
      for (const language of LANGUAGES) {
        const key = `${activeProblem.slug}:${language.id}`;
        if (next[key] === undefined) next[key] = judgeService.getStarterCode(activeProblem, language.id);
      }
      return next;
    });
    setCaseSelection('0');
    setCustomInput('');
    setExecution({ mode: null, status: 'idle', result: null });
  }, [activeProblem]);

  const loadHistory = () => {
    if (!activeProblem) return;
    setHistory((current) => ({ ...current, loading: true }));
    judgeService.getSubmissionHistory(activeProblem.slug).then((submissions) => setHistory({ loading: false, submissions }));
  };
  useEffect(loadHistory, [activeProblem]);

  if (state.loading) {
    return (
      <section className="section-wrap content-state">
        <LoadingState label="Loading contest workspace…" />
      </section>
    );
  }

  if (state.error instanceof ContestNotFoundError) {
    return (
      <section className="section-wrap content-state">
        <EmptyState title="Contest not found" action={<Button href="/contests">Back to contests</Button>}>
          We couldn't find a contest at "{slug}".
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

  const { contest } = state;
  const codeKey = `${activeProblem.slug}:${languageId}`;
  const code = codeByKey[codeKey] ?? '';
  const setCode = (value) => setCodeByKey((current) => ({ ...current, [codeKey]: value }));
  const resetCode = () => setCodeByKey((current) => ({ ...current, [codeKey]: judgeService.getStarterCode(activeProblem, languageId) }));

  const activeTestCase =
    caseSelection === 'custom'
      ? { input: customInput, expectedOutput: undefined }
      : { input: activeProblem.examples[Number(caseSelection)].input, expectedOutput: activeProblem.examples[Number(caseSelection)].output };

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
    const result = await judgeService.submitCode({ slug: activeProblem.slug, languageId, code, testCasesTotal: activeProblem.examples.length });
    setExecution({ mode: 'submit', status: 'done', result });
    loadHistory();
  };

  return (
    <section className="solve-page">
      <header className="solve-page__header section-wrap">
        <AppLink to={`/contests/${contest.slug}`} className="text-link">← {contest.title}</AppLink>
        <div className="solve-page__header-meta">
          <Badge tone={statusTone(contest.status)}>{contest.status}</Badge>
          <Badge tone="neutral">Contest Service · development preview</Badge>
          <Badge tone="neutral">Judge Service · development simulation</Badge>
        </div>
      </header>

      <div className="contest-problem-nav section-wrap">
        <ContestProblemNav problems={contest.problems} activeIndex={activeIndex} onChange={setActiveIndex} />
      </div>

      <div className="solve-workspace">
        <div className="solve-workspace__statement">
          <h1 className="solve-workspace__title">{String.fromCharCode(65 + activeIndex)}. {activeProblem.title}</h1>
          <div className="contest-problem-nav__meta">
            <Badge tone={DIFFICULTY_TONE[activeProblem.difficulty]}>{activeProblem.difficulty}</Badge>
            <span className="tag-chip">{activeEntry.points} pts</span>
          </div>
          <ProblemStatement problem={activeProblem} defaultOpen={false} />
          <ProblemExamples examples={activeProblem.examples} defaultOpen={false} />
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
                  examples={activeProblem.examples}
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
