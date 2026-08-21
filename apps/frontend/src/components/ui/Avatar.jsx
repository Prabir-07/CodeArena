// Renders a user's avatar image, falling back to their first initial.
// The caller supplies the base class so each surface keeps its own sizing;
// the fallback variant appends a `--fallback` modifier to it. Decorative in
// both forms — the adjacent markup always names the user.
export function Avatar({ name, src, className = 'avatar' }) {
  if (src) return <img src={src} alt="" className={className} />;
  const initial = (name || '').trim().charAt(0).toUpperCase() || '?';
  return <span className={`${className} ${className}--fallback`} aria-hidden="true">{initial}</span>;
}
