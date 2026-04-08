import clsx from 'clsx';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'data-fetching', label: 'Data' },
  { id: 'compute-offload', label: 'Compute' },
  { id: 'wallet-actions', label: 'Wallet' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'enrichment', label: 'Enrichment' },
  { id: 'orchestration', label: 'Orchestration' },
  { id: 'notifications', label: 'Alerts' },
];

interface Props {
  selected: string;
  onChange: (cat: string) => void;
}

export function CategoryFilter({ selected, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={clsx(
            'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
            selected === cat.id
              ? 'bg-brand-600/30 border-brand-500/40 text-brand-300'
              : 'bg-transparent border-white/8 text-gray-400 hover:text-white hover:border-white/20',
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
