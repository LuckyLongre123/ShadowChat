import { memo } from 'react';

const PrivacyOptionRow = memo(function PrivacyOptionRow({
  label,
  value,
  borderBottom = true,
}: {
  label: string;
  value: string;
  borderBottom?: boolean;
}) {
  return (
    <div
      className={[
        'flex w-full items-center justify-between px-5 py-4',
        'text-left transition-colors hover:bg-slate-50', // Normal hover feel
        borderBottom ? 'border-b border-slate-100' : '',
      ].join(' ')}
    >
      <div>
        {/* Normal Text Colors (No dimming) */}
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{value}</p>
      </div>

      {/* Sleek 'Coming soon' text instead of Arrow */}
      <span className="shrink-0 text-[11px] font-medium text-slate-400 italic">
        Coming soon
      </span>
    </div>
  );
});

export default PrivacyOptionRow;
