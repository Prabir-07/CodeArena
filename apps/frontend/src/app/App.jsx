import { AppShell } from '../components/layout/AppShell';
import { HomePage } from '../features/home/HomePage';

export function App() {
  return (
    <AppShell>
      <HomePage />
    </AppShell>
  );
}
