import { AppShell } from '../components/layout/AppShell';
import { RouterProvider, resolveRoute, useRouter } from './router';
import { ToastProvider } from '../components/ui/Toast';
import { AuthProvider } from '../features/auth/AuthContext';
import { AuthPage } from '../features/auth/AuthPage';
import { HomePage } from '../features/home/HomePage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { UnavailablePage } from '../features/future/UnavailablePage';
import { AccountActionPage } from '../features/account/AccountActionPage';
import { PublicProfilePage } from '../features/account/PublicProfilePage';
import { SessionsPage } from '../features/account/SessionsPage';
import { ProblemsPage } from '../features/problems/ProblemsPage';
import { ProblemDetailsPage } from '../features/problems/ProblemDetailsPage';
import { SolvePage } from '../features/problems/SolvePage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ContestsPage } from '../features/contests/ContestsPage';
import { ContestDetailsPage } from '../features/contests/ContestDetailsPage';
import { ContestSolvePage } from '../features/contests/ContestSolvePage';

const routes = [
  { path: '/', Page: HomePage },
  { path: '/login', Page: () => <AuthPage mode="login" /> },
  { path: '/register', Page: () => <AuthPage mode="register" /> },
  { path: '/dashboard', Page: DashboardPage },
  { path: '/profile', Page: ProfilePage },
  { path: '/sessions', Page: SessionsPage },
  { path: '/users/:username', Page: PublicProfilePage },
  { path: '/forgot-password', Page: () => <AccountActionPage action="forgot" /> },
  { path: '/reset-password', Page: () => <AccountActionPage action="reset" /> },
  { path: '/verify-email', Page: () => <AccountActionPage action="verify" /> },
  { path: '/problems', Page: ProblemsPage },
  { path: '/problems/:slug', Page: ProblemDetailsPage },
  { path: '/problems/:slug/solve', Page: SolvePage },
  { path: '/contests', Page: ContestsPage },
  { path: '/contests/:slug', Page: ContestDetailsPage },
  { path: '/contests/:slug/solve', Page: ContestSolvePage },
  { path: '/leaderboard', Page: () => <UnavailablePage feature="leaderboard" /> },
  { fallback: true, Page: HomePage },
];

function Route() {
  const { pathname } = useRouter();
  const { Page, params } = resolveRoute(routes, pathname);
  return <Page params={params} />;
}

export function App() {
  return (
    <RouterProvider><ToastProvider><AuthProvider><AppShell><Route /></AppShell></AuthProvider></ToastProvider></RouterProvider>
  );
}
