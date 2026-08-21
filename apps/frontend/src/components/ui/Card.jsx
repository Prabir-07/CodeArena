export function Card({ children, className = '', as: Component = 'section', ...props }) {
  return <Component className={`card ${className}`.trim()} {...props}>{children}</Component>;
}
