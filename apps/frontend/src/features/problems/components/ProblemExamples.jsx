import { Card } from '../../../components/ui/Card';

export function ProblemExamples({ examples, defaultOpen = true }) {
  return (
    <details className="problem-statement__section" open={defaultOpen}>
      <summary>Examples</summary>
      <div className="problem-examples">
        {examples.map((example, index) => (
          <Card as="article" className="problem-example" key={index}>
            <p className="problem-example__label">Example {index + 1}</p>
            <dl>
              <dt>Input</dt>
              <dd><code>{example.input}</code></dd>
              <dt>Output</dt>
              <dd><code>{example.output}</code></dd>
              {example.explanation && (
                <>
                  <dt>Explanation</dt>
                  <dd>{example.explanation}</dd>
                </>
              )}
            </dl>
          </Card>
        ))}
      </div>
    </details>
  );
}
