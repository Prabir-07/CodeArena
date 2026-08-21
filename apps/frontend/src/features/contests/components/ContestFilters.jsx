import { useEffect, useState } from 'react';
import { FormField } from '../../../components/ui/FormField';
import { Tabs } from '../../../components/ui/Tabs';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'Running', label: 'Running' },
  { value: 'Completed', label: 'Completed' },
];

// Reuses the Problems list's filter-bar styling (same shape: a search field
// plus a status Tabs row) instead of duplicating near-identical CSS.
export function ContestFilters({ filters, onChange }) {
  const [searchText, setSearchText] = useState(filters.search);

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
          <input type="search" placeholder="Search contests…" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
        </FormField>
      </div>
      <div className="problem-filters__status">
        <span className="problem-filters__status-label">Status</span>
        <Tabs tabs={STATUS_TABS} value={filters.status} onChange={(value) => onChange({ status: value })} />
      </div>
    </div>
  );
}
