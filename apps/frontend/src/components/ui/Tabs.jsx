export function Tabs({ tabs, value, onChange }) {
  return <div className="tabs" role="tablist">{tabs.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={value === tab.value} className={value === tab.value ? 'tabs__tab tabs__tab--active' : 'tabs__tab'} onClick={() => onChange(tab.value)}>{tab.label}</button>)}</div>;
}
