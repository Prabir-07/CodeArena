export function Table({ columns, children, caption }) {
  return <div className="table-scroll"><table className="data-table">{caption && <caption>{caption}</caption>}<thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
