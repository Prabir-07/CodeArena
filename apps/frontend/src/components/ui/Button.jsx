export function Button({ href, children, className = '', size = 'medium', variant = 'primary', ...props }) {
  const classes = `button button--${variant} button--${size} ${className}`.trim();
  if (href) return <a className={classes} href={href} {...props}>{children}</a>;
  return <button className={classes} {...props}>{children}</button>;
}
