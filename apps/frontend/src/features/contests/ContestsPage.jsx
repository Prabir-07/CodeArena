import { useEffect, useState } from 'react';
import { EmptyState, ErrorState, Skeleton } from '../../components/states/States';
import { Pagination } from '../../components/ui/Pagination';
import { contestService } from '../../lib/api/contestService';
import { ContestFilters } from './components/ContestFilters';
import { ContestList } from './components/ContestList';

const PAGE_SIZE = 6;
const INITIAL_FILTERS = { search: '', status: 'all', page: 1 };

export function ContestsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [state, setState] = useState({ loading: true, items: [], total: 0, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));
    contestService
      .listContests({ ...filters, pageSize: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setState({ loading: false, items: result.items, total: result.total, error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ loading: false, items: [], total: 0, error });
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const updateFilters = (patch) => {
    setFilters((current) => ({ ...current, ...patch, page: 'page' in patch ? patch.page : 1 }));
  };

  return (
    <section className="problems-page section-wrap">
      <header className="problems-header">
        <p className="eyebrow">CONTEST SERVICE · DEVELOPMENT PREVIEW</p>
        <h1>Contests</h1>
        <p>This preview runs on local development data — real schedules, registration, and rankings arrive once the Contest Service is live.</p>
      </header>

      <ContestFilters filters={filters} onChange={updateFilters} />

      {state.loading ? (
        <div className="problem-list-skeleton"><Skeleton lines={6} /></div>
      ) : state.error ? (
        <ErrorState onRetry={() => setFilters({ ...filters })}>{state.error.message}</ErrorState>
      ) : state.items.length === 0 ? (
        <EmptyState title="No contests match your filters">Try a different search term, or clear a filter.</EmptyState>
      ) : (
        <>
          <ContestList contests={state.items} />
          <Pagination page={filters.page} pageSize={PAGE_SIZE} total={state.total} onChange={(page) => updateFilters({ page })} />
        </>
      )}
    </section>
  );
}
