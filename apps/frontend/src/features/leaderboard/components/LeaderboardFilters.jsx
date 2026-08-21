import { useEffect, useState } from 'react';
import { FormField } from '../../../components/ui/FormField';

// Reuses the Problems/Contests filter-bar styling and the same debounced
// search-as-you-type behaviour.
export function LeaderboardFilters({ filters, onChange }) {
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
          <input type="search" placeholder="Search by name or handle…" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
        </FormField>
      </div>
    </div>
  );
}
