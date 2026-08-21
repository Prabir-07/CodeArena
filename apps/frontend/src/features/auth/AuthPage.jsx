import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from '../../components/ui/Button';
import { ServiceUnavailableState } from '../../components/states/States';
import { userService } from '../../lib/api/userService';

const loginFields = [{ name: 'email', label: 'Email address', type: 'email' }, { name: 'password', label: 'Password', type: 'password' }];
const registerFields = [{ name: 'firstName', label: 'First name' }, { name: 'lastName', label: 'Last name' }, { name: 'username', label: 'Username' }, ...loginFields];

export function AuthPage({ mode }) {
  const { login, register } = useAuth();
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const isRegister = mode === 'register';
  const fields = isRegister ? registerFields : loginFields;
  const submit = async (event) => {
    event.preventDefault(); setPending(true); setError('');
    try { await (isRegister ? register(form) : login(form)); window.location.assign('/profile'); }
    catch (err) { setError(err); setPending(false); }
  };
  return <section className="auth-page section-wrap"><div className="auth-card"><p className="eyebrow">{isRegister ? 'WELCOME TO THE ARENA' : 'WELCOME BACK'}</p><h1>{isRegister ? 'Start your practice.' : 'Pick up where you left off.'}</h1><p>{isRegister ? 'Create an account to track your progress as the arena grows.' : 'Log in to continue your CodeArena journey.'}</p>
    {error && (error.status === 0 ? <ServiceUnavailableState onRetry={() => setError('')} /> : <div className="form-error" role="alert">{error.message || error}</div>)}
    <form onSubmit={submit} className="auth-form">{fields.map((field) => <label key={field.name}>{field.label}<input required type={field.type || 'text'} value={form[field.name] || ''} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} /></label>)}<Button type="submit" disabled={pending}>{pending ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}</Button></form><div className="auth-options"><a href={userService.googleUrl}>Continue with Google</a>{!isRegister && <a href="/forgot-password">Forgot password?</a>}</div>
    <p className="auth-card__switch">{isRegister ? 'Already have an account?' : 'New to CodeArena?'} <a href={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create one'}</a></p>
  </div></section>;
}
