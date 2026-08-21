export function FormField({ label, hint, error, children }) {
  return <label className={`form-field ${error ? 'form-field--error' : ''}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}{error && <small className="form-field__error">{error}</small>}</label>;
}
