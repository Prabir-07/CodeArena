import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const notify = useCallback((message, tone = 'success') => { const id = crypto.randomUUID(); setToasts((items) => [...items, { id, message, tone }]); window.setTimeout(() => dismiss(id), 4500); }, [dismiss]);
  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);
  return <ToastContext.Provider value={value}>{children}<div className="toast-region" aria-live="polite">{toasts.map((toast) => <div className={`toast toast--${toast.tone}`} key={toast.id}>{toast.message}<button type="button" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}>×</button></div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
