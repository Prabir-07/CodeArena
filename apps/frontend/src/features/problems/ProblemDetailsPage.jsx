import { useEffect, useState } from 'react';
import { AppLink } from '../../app/router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '../../components/states/States';
import { ProblemNotFoundError, problemService } from '../../lib/api/problemService';
import { ProblemExamples } from './components/ProblemExamples';
import { ProblemStatement } from './components/ProblemStatement';

const DIFFICULTY_TONE = { Easy: 'success', Medium: 'warning', Hard: 'danger' };

export function ProblemDetailsPage({ params }) {
  const { slug } = params;
  const [state, setState] = useState({ loading: true, problem: null, stats: null, error: null });

  const load = () => {
    setState({ loading: true, problem: null, stats: null, error: null });
    Promise.all([problemService.getProblem(slug), problemService.getProblemStats(slug)])
      .then(([problem, stats]) => setState({ loading: false, problem, stats, error: null }))
      .catch((error) => setState({ loading: false, problem: null, stats: null, error }));
  };

  useEffect(load, [slug]);

  if (state.loading) {
    return (
      <section className="section-wrap content-state">
        <LoadingState label="Loading problem…" />
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

  const { problem, stats } = state;

  return (
    <section className="problem-details-page section-wrap">
      <AppLink to="/problems" className="text-link problem-details-page__back">← Back to problems</AppLink>
      <header className="problem-details-page__header">
        <p className="eyebrow">PROBLEM SERVICE · DEVELOPMENT PREVIEW</p>
        <h1>{problem.title}</h1>
        <div className="problem-details-page__meta">
          <Badge tone={DIFFICULTY_TONE[problem.difficulty]}>{problem.difficulty}</Badge>
          {problem.tags.map((tag) => <span className="tag-chip" key={tag}>{tag}</span>)}
        </div>
      </header>

      <div className="problem-details-page__body">
        <div className="problem-details-page__statement">
          <ProblemStatement problem={problem} />
          <ProblemExamples examples={problem.examples} />
        </div>
        <aside className="problem-details-page__side">
          <Card className="problem-stats-card">
            <h2>Problem stats</h2>
            <dl>
              <dt>Acceptance</dt>
              <dd>{stats.acceptanceRate.toFixed(1)}%</dd>
              <dt>Solved by</dt>
              <dd>{stats.solvedCount.toLocaleString()} users</dd>
              <dt>Submissions</dt>
              <dd>{stats.submissionCount.toLocaleString()}</dd>
            </dl>
          </Card>
          <Button href={`/problems/${problem.slug}/solve`} className="problem-details-page__cta">Start solving →</Button>
        </aside>
      </div>
    </section>
  );
}
