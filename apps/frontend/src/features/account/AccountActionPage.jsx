import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { ServiceUnavailableState } from '../../components/states/States';
import { userService } from '../../lib/api/userService';

const content = {
  forgot: { eyebrow: 'ACCOUNT RECOVERY', title: 'Reset your password', copy: 'Enter your email address and we will request a password reset link.', fields: [{ name: 'email', label: 'Email address', type: 'email' }], submit: (data) => userService.forgotPassword(data.email) },
  reset: { eyebrow: 'ACCOUNT RECOVERY', title: 'Choose a new password', copy: 'Use the token from your password reset link to set a new password.', fields: [{ name: 'token', label: 'Reset token' }, { name: 'newPassword', label: 'New password', type: 'password', hint: '8–72 characters with upper/lowercase, number, and special character.' }], submit: (data) => userService.resetPassword(data.token, data.newPassword) },
  verify: { eyebrow: 'EMAIL VERIFICATION', title: 'Verify your email', copy: 'Enter the verification token from your verification message.', fields: [{ name: 'token', label: 'Verification token' }], submit: (data) => userService.verifyEmail(data.token) },
};

export function AccountActionPage({ action }) {
  const page = content[action]; const [form, setForm] = useState({}); const [error, setError] = useState(null); const [success, setSuccess] = useState(''); const [pending, setPending] = useState(false);
  const submit = async (event) => { event.preventDefault(); setPending(true); setError(null); try { const response = await page.submit(form); setSuccess(response.message); } catch (err) { setError(err); } finally { setPending(false); } };
  return <section className="auth-page section-wrap"><div className="auth-card"><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1><p>{page.copy}</p>{success && <div className="form-notice">{success}</div>}{error && (error.kind === 'unavailable' ? <ServiceUnavailableState onRetry={() => setError(null)} /> : <div className="form-error" role="alert">{error.message}</div>)}<form className="auth-form" onSubmit={submit}>{page.fields.map((field) => <FormField key={field.name} label={field.label} hint={field.hint}><input required type={field.type || 'text'} value={form[field.name] || ''} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} /></FormField>)}<Button type="submit" disabled={pending}>{pending ? 'Please wait…' : 'Continue'}</Button></form></div></section>;
}
