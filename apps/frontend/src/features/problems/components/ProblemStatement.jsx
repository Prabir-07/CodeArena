export function ProblemStatement({ problem, defaultOpen = true }) {
  const paragraphs = problem.description.split('\n\n');
  return (
    <div className="problem-statement">
      {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      <details className="problem-statement__section" open={defaultOpen}>
        <summary>Constraints</summary>
        <ul>{problem.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul>
      </details>
      <details className="problem-statement__section" open={defaultOpen}>
        <summary>Input &amp; output</summary>
        <p>
          Read input in the format shown in the examples below, and produce the result described for{' '}
          <code>{problem.signature.name}</code>. Exact I/O framing (stdin/stdout vs. function return) will be defined by the
          Judge Service once it exists.
        </p>
      </details>
    </div>
  );
}
