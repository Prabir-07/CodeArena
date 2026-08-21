export function Brand({ compact = false }) {
  return (
    <span className="brand">
      <span className="brand__mark" aria-hidden="true">&lt;/&gt;</span>
      <span className="brand__name">Code<span>Arena</span></span>
      {!compact && <span className="brand__tag">practice. compete. grow.</span>}
    </span>
  );
}
