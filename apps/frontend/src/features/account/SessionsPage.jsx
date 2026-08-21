import { useEffect, useState } from 'react';
import { ConfirmationState, EmptyState, ErrorState, LoadingState, ServiceUnavailableState } from '../../components/states/States';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { RequireAuth } from '../../components/auth/RequireAuth';
import { userService } from '../../lib/api/userService';

export function SessionsPage() {
  return (
    <RequireAuth
      loading={<section className="section-wrap content-state"><LoadingState label="Checking your account…" /></section>}
      fallback={<section className="section-wrap content-state"><EmptyState title="Log in to manage sessions" action={<Button href="/login">Log in</Button>}>Active sessions are available to signed-in users.</EmptyState></section>}
    >
      <SessionsContent />
    </RequireAuth>
  );
}

function SessionsContent() {
  const { notify } = useToast();
  const [state, setState] = useState({ loading: true, sessions: [], error: null }); const [confirming, setConfirming] = useState(false);
  const load = () => { setState({ loading: true, sessions: [], error: null }); userService.getSessions().then((response) => setState({ loading: false, sessions: response.data.sessions, error: null })).catch((error) => setState({ loading: false, sessions: [], error })); };
  useEffect(load, []);
  const remove = async (id) => { try { await userService.deleteSession(id); notify('Session revoked.'); load(); } catch (error) { notify(error.message, 'error'); } };
  const removeOthers = async () => { setConfirming(false); try { await userService.deleteOtherSessions(); notify('Other sessions revoked.'); load(); } catch (error) { notify(error.message, 'error'); } };
  return <section className="profile-page section-wrap"><p className="eyebrow">ACCOUNT SECURITY</p><h1>Active sessions</h1><p className="profile-handle">Review devices that are signed into your account.</p>{state.loading ? <LoadingState label="Loading sessions…" /> : state.error?.kind === 'unavailable' ? <ServiceUnavailableState onRetry={load} /> : state.error ? <ErrorState onRetry={load}>{state.error.message}</ErrorState> : state.sessions.length === 0 ? <EmptyState title="No active sessions">Sign in to start a new session.</EmptyState> : <><Table columns={['Device', 'Created', 'Expires', '']} caption="Your active CodeArena sessions">{state.sessions.map((session) => <tr key={session.id}><td>{session.browser || session.userAgent || 'Unknown device'}</td><td>{new Date(session.createdAt).toLocaleString()}</td><td>{new Date(session.expiresAt).toLocaleString()}</td><td><Button size="small" variant="secondary" onClick={() => remove(session.id)}>Revoke</Button></td></tr>)}</Table><Button variant="secondary" onClick={() => setConfirming(true)}>Revoke other sessions</Button></>}{confirming && <ConfirmationState title="Revoke other sessions?" onConfirm={removeOthers} onCancel={() => setConfirming(false)}>Your current session will stay active.</ConfirmationState>}</section>;
}
