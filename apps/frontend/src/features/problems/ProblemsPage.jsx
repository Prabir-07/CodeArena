import { useEffect, useState } from 'react';
import { EmptyState, ErrorState, Skeleton } from '../../components/states/States';
import { Pagination } from '../../components/ui/Pagination';
import { problemService } from '../../lib/api/problemService';
import { ProblemFilters } from './components/ProblemFilters';
import { ProblemList } from './components/ProblemList';

const PAGE_SIZE = 8;
const INITIAL_FILTERS = { search: '', difficulty: 'all', tag: 'all', status: 'all', page: 1 };

export function ProblemsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [tags, setTags] = useState([]);
  const [state, setState] = useState({ loading: true, items: [], total: 0, error: null });

  useEffect(() => {
    problemService.getProblemTags().then(setTags).catch(() => setTags([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));
    problemService
      .listProblems({ ...filters, pageSize: PAGE_SIZE })
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
        <p className="eyebrow">PROBLEM SERVICE · DEVELOPMENT PREVIEW</p>
        <h1>Practice problems</h1>
        <p>This preview runs on local development data — real problems, stats, and progress arrive once the Problem Service is live.</p>
      </header>

      <ProblemFilters filters={filters} tags={tags} onChange={updateFilters} />

      {state.loading ? (
        <div className="problem-list-skeleton"><Skeleton lines={6} /></div>
      ) : state.error ? (
        <ErrorState onRetry={() => setFilters({ ...filters })}>{state.error.message}</ErrorState>
      ) : state.items.length === 0 ? (
        <EmptyState title="No problems match your filters">Try a different search term, or clear a filter.</EmptyState>
      ) : (
        <>
          <ProblemList problems={state.items} />
          <Pagination page={filters.page} pageSize={PAGE_SIZE} total={state.total} onChange={(page) => updateFilters({ page })} />
        </>
      )}
    </section>
  );
}
