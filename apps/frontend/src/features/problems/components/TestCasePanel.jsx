import { Tabs } from '../../../components/ui/Tabs';

export function TestCasePanel({ examples, selectedIndex, onSelect, customInput, onCustomInputChange }) {
  const tabs = [
    ...examples.map((_, index) => ({ value: String(index), label: `Case ${index + 1}` })),
    { value: 'custom', label: 'Custom' },
  ];
  const isCustom = selectedIndex === 'custom';
  const activeExample = isCustom ? null : examples[Number(selectedIndex)];

  return (
    <div className="test-case-panel">
      <Tabs tabs={tabs} value={selectedIndex} onChange={onSelect} />
      {isCustom ? (
        <label className="test-case-panel__input">
          <span>Custom input</span>
          <textarea
            value={customInput}
            onChange={(event) => onCustomInputChange(event.target.value)}
            placeholder="Enter input for your code…"
            rows={4}
          />
        </label>
      ) : (
        <div className="test-case-panel__input">
          <span>Input</span>
          <pre>{activeExample.input}</pre>
        </div>
      )}
    </div>
  );
}
