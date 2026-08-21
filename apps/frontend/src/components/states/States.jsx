import { Button } from '../ui/Button';

export function LoadingState({ label = 'Loading…' }) { return <div className="state state--loading" role="status"><span className="spinner" />{label}</div>; }
export function Skeleton({ lines = 3 }) { return <div className="skeleton" aria-label="Loading content">{Array.from({ length: lines }, (_, index) => <span key={index} style={{ width: `${index === lines - 1 ? 58 : 100}%` }} />)}</div>; }
export function EmptyState({ title, children, action }) { return <section className="state"><h2>{title}</h2>{children && <p>{children}</p>}{action}</section>; }
export function ErrorState({ title = 'Something went wrong', children, onRetry }) { return <section className="state state--error" role="alert"><h2>{title}</h2>{children && <p>{children}</p>}{onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}</section>; }
export function ServiceUnavailableState({ onRetry }) { return <ErrorState title="Service temporarily unavailable" onRetry={onRetry}>CodeArena could not reach the account service. Check that it is running, then try again.</ErrorState>; }
export function ConfirmationState({ title, children, confirmLabel = 'Confirm', onConfirm, onCancel }) { return <div className="confirmation"><h3>{title}</h3><p>{children}</p><div><Button onClick={onConfirm}>{confirmLabel}</Button><Button variant="secondary" onClick={onCancel}>Cancel</Button></div></div>; }
