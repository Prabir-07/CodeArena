import { useEffect, useState } from 'react';
import { ErrorState, LoadingState, ServiceUnavailableState } from '../../components/states/States';
import { Card } from '../../components/ui/Card';
import { userService } from '../../lib/api/userService';

export function PublicProfilePage({ params }) {
  const [state, setState] = useState({ loading: true, user: null, error: null });
  const load = () => { setState({ loading: true, user: null, error: null }); userService.getPublicProfile(params.username).then((response) => setState({ loading: false, user: response.data.user, error: null })).catch((error) => setState({ loading: false, user: null, error })); };
  useEffect(load, [params.username]);
  if (state.loading) return <section className="section-wrap content-state"><LoadingState label="Loading public profile…" /></section>;
  if (state.error?.kind === 'unavailable') return <section className="section-wrap content-state"><ServiceUnavailableState onRetry={load} /></section>;
  if (state.error) return <section className="section-wrap content-state"><ErrorState title="Profile unavailable" onRetry={load}>{state.error.message}</ErrorState></section>;
  const { user } = state;
  return <section className="profile-page section-wrap"><p className="eyebrow">PUBLIC PROFILE</p><h1>{user.firstName} {user.lastName}</h1><p className="profile-handle">@{user.username}</p><Card className="public-profile-card">{user.bio && <p>{user.bio}</p>}<dl><dt>Country</dt><dd>{user.country || 'Not set'}</dd><dt>College</dt><dd>{user.college || 'Not set'}</dd><dt>Member since</dt><dd>{new Date(user.createdAt).toLocaleDateString()}</dd></dl></Card></section>;
}
