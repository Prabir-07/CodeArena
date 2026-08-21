import { useEffect, useRef, useState } from 'react';

export function Dropdown({ trigger, children, align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (event) => { if (!ref.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return <div className="dropdown" ref={ref}><button className="dropdown__trigger" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{trigger}</button>{open && <div className={`dropdown__menu dropdown__menu--${align}`}>{children}</div>}</div>;
}
