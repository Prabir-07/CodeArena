import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { RequireAuth } from '../../components/auth/RequireAuth';
import { Button } from '../../components/ui/Button';
import { ErrorState, LoadingState } from '../../components/states/States';
import { dashboardService } from '../../lib/api/dashboardService';
import { DashboardHeader } from './components/DashboardHeader';
import { ProgressOverview } from './components/ProgressOverview';
import { QuickActions } from './components/QuickActions';
import { RecentActivity } from './components/RecentActivity';
import { RecentSubmissions } from './components/RecentSubmissions';
import { StatsGrid } from './components/StatsGrid';

export function DashboardPage() {
  return (
    <RequireAuth
      loading={<section className="section-wrap content-state"><LoadingState label="Loading your dashboard…" /></section>}
      fallback={<section className="section-wrap content-state"><h1>Your dashboard is waiting.</h1><p>Log in to see your CodeArena progress.</p><Button href="/login">Log in</Button></section>}
    >
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, data: null, error: null });

  const load = () => {
    setState({ loading: true, data: null, error: null });
    Promise.all([
      dashboardService.getStats(),
      dashboardService.getProgressOverview(),
      dashboardService.getRecentActivity(),
      dashboardService.getRecentSubmissions(),
    ])
      .then(([stats, progress, activity, submissions]) => setState({ loading: false, data: { stats, progress, activity, submissions }, error: null }))
      .catch((error) => setState({ loading: false, data: null, error }));
  };
  useEffect(load, []);

  if (state.loading) {
    return (
      <section className="section-wrap content-state">
        <LoadingState label="Loading your dashboard…" />
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

  const { stats, progress, activity, submissions } = state.data;

  return (
    <section className="dashboard-page section-wrap">
      <DashboardHeader user={user} />
      <StatsGrid stats={stats} />
      <div className="dashboard-grid">
        <div className="dashboard-grid__main">
          <ProgressOverview progress={progress} />
          <RecentSubmissions submissions={submissions} />
        </div>
        <aside className="dashboard-grid__side">
          <QuickActions />
          <RecentActivity activity={activity} />
        </aside>
      </div>
    </section>
  );
}
