import { useEffect, useState } from 'react';
import { AppLink } from '../../app/router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../../components/states/States';
import { ProblemNotFoundError, problemService } from '../../lib/api/problemService';
import { ProblemExamples } from './components/ProblemExamples';
import { ProblemStatement } from './components/ProblemStatement';

const DIFFICULTY_TONE = { Easy: 'success', Medium: 'warning', Hard: 'danger' };

export function ProblemDetailsPage({ params }) {
  const { slug } = params;
  const [state, setState] = useState({ loading: true, problem: null, error: null });

  const load = () => {
    setState({ loading: true, problem: null, error: null });
    problemService
      .getProblem(slug)
      .then((problem) => setState({ loading: false, problem, error: null }))
      .catch((error) => setState({ loading: false, problem: null, error }));
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

  const { problem } = state;

  return (
    <section className="problem-details-page section-wrap">
      <AppLink to="/problems" className="text-link problem-details-page__back">← Back to problems</AppLink>
      <header className="problem-details-page__header">
        <p className="eyebrow">PROBLEM SERVICE</p>
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
        {/*
          The "Problem stats" card (acceptance rate, solved-by count, total
          submissions) was removed here. Every figure in it was derived from
          submissions, which the Problem Service does not own, and the previous
          values came from a fixed mock table that cannot describe an
          admin-authored problem. It returns when a Judge Service can supply
          real numbers.
        */}
        <aside className="problem-details-page__side">
          <Button href={`/problems/${problem.slug}/solve`} className="problem-details-page__cta">Start solving →</Button>
        </aside>
      </div>
    </section>
  );
}
