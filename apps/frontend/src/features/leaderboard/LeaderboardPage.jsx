import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../../components/ui/Card';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState, Skeleton } from '../../components/states/States';
import { leaderboardService } from '../../lib/api/leaderboardService';
import { GlobalLeaderboardTable } from './components/GlobalLeaderboardTable';
import { LeaderboardFilters } from './components/LeaderboardFilters';
import { RankCell } from './components/RankCell';

const PAGE_SIZE = 10;
const INITIAL_FILTERS = { search: '', page: 1 };

export function LeaderboardPage() {
  const { user } = useAuth();
  const currentUsername = user?.username ?? null;
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [state, setState] = useState({ loading: true, items: [], total: 0, currentUserEntry: null, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));
    leaderboardService
      .getGlobalLeaderboard({ ...filters, pageSize: PAGE_SIZE, currentUsername })
      .then((result) => {
        if (cancelled) return;
        setState({ loading: false, items: result.items, total: result.total, currentUserEntry: result.currentUserEntry, error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ loading: false, items: [], total: 0, currentUserEntry: null, error });
      });
    return () => {
      cancelled = true;
    };
  }, [filters, currentUsername]);

  const updateFilters = (patch) => {
    setFilters((current) => ({ ...current, ...patch, page: 'page' in patch ? patch.page : 1 }));
  };

  return (
    <section className="problems-page section-wrap">
      <header className="problems-header">
        <p className="eyebrow">LEADERBOARD SERVICE · DEVELOPMENT PREVIEW</p>
        <h1>Global leaderboard</h1>
        <p>This preview runs on local development data — real ratings and rankings arrive once the Leaderboard Service is live.</p>
      </header>

      {state.currentUserEntry && (
        <Card className="leaderboard-self">
          <p className="leaderboard-self__label">Your standing</p>
          <div className="leaderboard-self__stats">
            <RankCell rank={state.currentUserEntry.rank} change={state.currentUserEntry.rankChange} />
            <span><b>{state.currentUserEntry.rating.toLocaleString()}</b> rating</span>
            <span><b>{state.currentUserEntry.problemsSolved.toLocaleString()}</b> solved</span>
            <span><b>{state.currentUserEntry.contestsPlayed}</b> contests</span>
          </div>
        </Card>
      )}

      <LeaderboardFilters filters={filters} onChange={updateFilters} />

      {state.loading ? (
        <div className="problem-list-skeleton"><Skeleton lines={6} /></div>
      ) : state.error ? (
        <ErrorState onRetry={() => setFilters({ ...filters })}>{state.error.message}</ErrorState>
      ) : state.items.length === 0 ? (
        <EmptyState title="No ranked users match your search">Try a different name or handle.</EmptyState>
      ) : (
        <>
          <GlobalLeaderboardTable entries={state.items} currentUsername={currentUsername} />
          <Pagination page={filters.page} pageSize={PAGE_SIZE} total={state.total} onChange={(page) => updateFilters({ page })} />
        </>
      )}
    </section>
  );
}
