import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { RequireAuth } from '../../components/auth/RequireAuth';
import { userService } from '../../lib/api/userService';

export function ProfilePage() {
  return (
    <RequireAuth
      loading={<section className="section-wrap content-state">Loading your profile…</section>}
      fallback={<section className="section-wrap content-state"><h1>Your arena is waiting.</h1><p>Log in to view and update your CodeArena profile.</p><Button href="/login">Log in</Button></section>}
    >
      <ProfileContent />
    </RequireAuth>
  );
}

function ProfileContent() {
  const { user, updateUser, logout } = useAuth();
  const { notify } = useToast();
  const [editing, setEditing] = useState(false); const [error, setError] = useState('');
  const save = async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); setError(''); try { await updateUser(data); setEditing(false); notify('Profile updated successfully.'); } catch (err) { setError(err.message); } };
  const resendVerification = async () => { try { const response = await userService.resendVerification(); notify(response.message); } catch (err) { notify(err.message, 'error'); } };
  return <section className="profile-page section-wrap"><div className="profile-heading"><div><p className="eyebrow">YOUR PROFILE</p><h1>{user.firstName} {user.lastName}</h1><p>@{user.username} · {user.isEmailVerified ? 'Email verified' : 'Email not verified'}</p></div><Button variant="secondary" onClick={() => logout().then(() => window.location.assign('/'))}>Log out</Button></div>{!user.isEmailVerified && <div className="form-error">Your email is not verified. <button type="button" onClick={resendVerification}>Resend verification</button></div>}
    <div className="profile-grid"><article className="profile-card"><h2>Personal details</h2>{editing ? <form className="auth-form" onSubmit={save}><label>First name<input name="firstName" defaultValue={user.firstName} required /></label><label>Last name<input name="lastName" defaultValue={user.lastName} required /></label><label>Country<input name="country" defaultValue={user.country || ''} /></label>{error && <div className="form-error">{error}</div>}<div className="form-actions"><Button type="submit">Save changes</Button><Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button></div></form> : <><dl><dt>Email</dt><dd>{user.email}</dd><dt>Country</dt><dd>{user.country || 'Not set'}</dd><dt>Member since</dt><dd>{new Date(user.createdAt).toLocaleDateString()}</dd></dl><Button variant="secondary" onClick={() => setEditing(true)}>Edit profile</Button></>}</article><aside className="profile-card profile-card--muted"><p className="eyebrow">COMING WITH JUDGE SERVICE</p><h2>Your coding record</h2><p>Problems solved, language history, and submission results will appear here when their service contracts are available.</p></aside></div></section>;
}
