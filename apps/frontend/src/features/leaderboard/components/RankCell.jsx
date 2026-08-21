// Shared rank cell. `change` is positions gained (+) or lost (-) since the
// previous ranking period; omit it for standings where movement has no
// meaning (e.g. a single contest's final results).
export function RankCell({ rank, change }) {
  const medal = rank <= 3 ? ` rank-cell__position--medal rank-cell__position--${rank}` : '';
  return (
    <span className="rank-cell">
      <span className={`rank-cell__position${medal}`}>{rank}</span>
      {change !== undefined && (
        change === 0
          ? <span className="rank-cell__change" title="No change">—</span>
          : <span className={`rank-cell__change rank-cell__change--${change > 0 ? 'up' : 'down'}`}>
              {change > 0 ? '▲' : '▼'}{Math.abs(change)}
            </span>
      )}
    </span>
  );
}
