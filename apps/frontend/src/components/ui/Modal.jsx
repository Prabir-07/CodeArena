import { useEffect } from 'react';

export function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}><header><h2 id="modal-title">{title}</h2><button className="icon-button" type="button" aria-label="Close dialog" onClick={onClose}>×</button></header>{children}</section></div>;
}
