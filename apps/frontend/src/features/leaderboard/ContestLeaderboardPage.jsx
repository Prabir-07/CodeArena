import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { AppLink } from '../../app/router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState, Skeleton } from '../../components/states/States';
import { ContestNotFoundError, statusTone } from '../../lib/api/contestService';
import { leaderboardService } from '../../lib/api/leaderboardService';
import { ContestLeaderboardTable } from './components/ContestLeaderboardTable';

const PAGE_SIZE = 10;

export function ContestLeaderboardPage({ params }) {
  const { slug } = params;
  const { user } = useAuth();
  const currentUsername = user?.username ?? null;
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, contest: null, items: [], total: 0, error: null });

  const [reloadToken, setReloadToken] = useState(0);

  // The cancelled guard keeps a slow earlier response (e.g. from rapid
  // pagination clicks) from overwriting a newer one.
  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));
    leaderboardService
      .getContestLeaderboard(slug, { page, pageSize: PAGE_SIZE, currentUsername })
      .then((result) => {
        if (cancelled) return;
        setState({ loading: false, contest: result.contest, items: result.items, total: result.total, error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ loading: false, contest: null, items: [], total: 0, error });
      });
    return () => {
      cancelled = true;
    };
  }, [slug, page, currentUsername, reloadToken]);

  const load = () => setReloadToken((token) => token + 1);

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

  return (
    <section className="problems-page section-wrap">
      <AppLink to={`/contests/${slug}`} className="text-link problem-details-page__back">← Back to contest</AppLink>
      <header className="problems-header">
        <p className="eyebrow">LEADERBOARD SERVICE · DEVELOPMENT PREVIEW</p>
        <h1>{state.contest ? state.contest.title : 'Contest standings'}</h1>
        {state.contest && (
          <div className="problem-details-page__meta">
            <Badge tone={statusTone(state.contest.status)}>{state.contest.status}</Badge>
            <span className="tag-chip">{state.contest.problemCount} problems</span>
            <span className="tag-chip">{state.contest.participantCount.toLocaleString()} participants</span>
          </div>
        )}
      </header>

      {state.loading ? (
        <div className="problem-list-skeleton"><Skeleton lines={6} /></div>
      ) : state.items.length === 0 ? (
        <EmptyState title="No standings yet" action={<Button href={`/contests/${slug}`}>View contest</Button>}>
          {state.contest?.status === 'Upcoming'
            ? 'Standings appear once this contest starts.'
            : 'No participants have been ranked for this contest yet.'}
        </EmptyState>
      ) : (
        <>
          <ContestLeaderboardTable entries={state.items} currentUsername={currentUsername} />
          <Pagination page={page} pageSize={PAGE_SIZE} total={state.total} onChange={setPage} />
        </>
      )}
    </section>
  );
}
