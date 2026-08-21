import { useEffect, useState } from 'react';
import { AppLink } from '../../app/router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '../../components/states/States';
import { ContestNotFoundError, contestService, statusTone } from '../../lib/api/contestService';
import { ContestProblemList } from './components/ContestProblemList';
import { formatDuration } from './components/ContestList';

export function ContestDetailsPage({ params }) {
  const { slug } = params;
  const [state, setState] = useState({ loading: true, contest: null, error: null });

  const load = () => {
    setState({ loading: true, contest: null, error: null });
    contestService
      .getContest(slug)
      .then((contest) => setState({ loading: false, contest, error: null }))
      .catch((error) => setState({ loading: false, contest: null, error }));
  };

  useEffect(load, [slug]);

  if (state.loading) {
    return (
      <section className="section-wrap content-state">
        <LoadingState label="Loading contest…" />
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
  const cta =
    contest.status === 'Upcoming' ? (
      <Button disabled className="problem-details-page__cta">Starts {new Date(contest.startTime).toLocaleString()}</Button>
    ) : (
      <Button href={`/contests/${contest.slug}/solve`} className="problem-details-page__cta">
        {contest.status === 'Running' ? 'Enter contest →' : 'Practice problems →'}
      </Button>
    );

  return (
    <section className="problem-details-page section-wrap">
      <AppLink to="/contests" className="text-link problem-details-page__back">← Back to contests</AppLink>
      <header className="problem-details-page__header">
        <p className="eyebrow">CONTEST SERVICE · DEVELOPMENT PREVIEW</p>
        <h1>{contest.title}</h1>
        <div className="problem-details-page__meta">
          <Badge tone={statusTone(contest.status)}>{contest.status}</Badge>
          <span className="tag-chip">{formatDuration(contest.durationMinutes)}</span>
          <span className="tag-chip">{contest.problems.length} problems</span>
        </div>
      </header>

      <div className="problem-details-page__body">
        <div className="problem-details-page__statement">
          <p>{contest.description}</p>

          <details className="problem-statement__section" open>
            <summary>Rules</summary>
            <ul>{contest.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
          </details>

          <details className="problem-statement__section" open>
            <summary>Problems</summary>
            <ContestProblemList problems={contest.problems} />
          </details>
        </div>
        <aside className="problem-details-page__side">
          <Card className="problem-stats-card">
            <h2>Contest details</h2>
            <dl>
              <dt>Starts</dt>
              <dd>{new Date(contest.startTime).toLocaleString()}</dd>
              <dt>Ends</dt>
              <dd>{new Date(contest.endTime).toLocaleString()}</dd>
              <dt>Duration</dt>
              <dd>{formatDuration(contest.durationMinutes)}</dd>
              <dt>{contest.status === 'Upcoming' ? 'Registered' : 'Participants'}</dt>
              <dd>{contest.participantCount.toLocaleString()}</dd>
            </dl>
          </Card>
          {cta}
        </aside>
      </div>
    </section>
  );
}
