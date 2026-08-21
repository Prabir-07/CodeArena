import { useEffect, useState } from 'react';
import { FormField } from '../../../components/ui/FormField';
import { Tabs } from '../../../components/ui/Tabs';

const DIFFICULTIES = ['all', 'Easy', 'Medium', 'Hard'];
const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'solved', label: 'Solved' },
  { value: 'attempted', label: 'Attempted' },
  { value: 'todo', label: 'Todo' },
];

export function ProblemFilters({ filters, tags, onChange }) {
  const [searchText, setSearchText] = useState(filters.search);

  // Debounce search-as-you-type so every keystroke doesn't refetch the list.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchText !== filters.search) onChange({ search: searchText });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  return (
    <div className="problem-filters">
      <div className="problem-filters__row">
        <FormField label="Search">
          <input type="search" placeholder="Search problems…" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
        </FormField>
        <FormField label="Difficulty">
          <select value={filters.difficulty} onChange={(event) => onChange({ difficulty: event.target.value })}>
            {DIFFICULTIES.map((difficulty) => (
              <option key={difficulty} value={difficulty}>{difficulty === 'all' ? 'All difficulties' : difficulty}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Topic">
          <select value={filters.tag} onChange={(event) => onChange({ tag: event.target.value })}>
            <option value="all">All topics</option>
            {tags.map(({ tag, count }) => (
              <option key={tag} value={tag}>{tag} ({count})</option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="problem-filters__status">
        <span className="problem-filters__status-label">Status</span>
        <Tabs tabs={STATUS_TABS} value={filters.status} onChange={(value) => onChange({ status: value })} />
      </div>
    </div>
  );
}
