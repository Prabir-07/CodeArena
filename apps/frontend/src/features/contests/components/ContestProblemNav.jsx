import { Tabs } from '../../../components/ui/Tabs';

export function ContestProblemNav({ problems, activeIndex, onChange }) {
  const tabs = problems.map((entry, index) => ({
    value: String(index),
    label: `${String.fromCharCode(65 + index)} · ${entry.problem.title}`,
  }));
  return <Tabs tabs={tabs} value={String(activeIndex)} onChange={(value) => onChange(Number(value))} />;
}
