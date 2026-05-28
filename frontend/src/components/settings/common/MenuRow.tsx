import { MenuRowProps } from '@/types/setting.types';
import { memo } from 'react';

const MenuRow = memo(function MenuRow({
  id,
  icon,
  title,
  subtitle,
  active,
  onSelect,
  danger = false,
}: MenuRowProps) {
  // 🌟 Check if this option is currently locked/disabled
  const isDisabled = id === null;

  return (
    <button
      onClick={() => !isDisabled && onSelect(id)}
      disabled={isDisabled}
      aria-current={active && !isDisabled ? 'page' : undefined}
      className={[
        // Touch-target layout
        'flex w-full items-center gap-4 px-5 py-3.5 text-left transition-all duration-200 select-none',

        // 🌟 Interactive States Conditional Logic
        isDisabled
          ? 'cursor-not-allowed bg-slate-50/30 opacity-55' // Beautiful locked UI
          : 'cursor-pointer hover:bg-slate-50 active:bg-slate-100',

        // Active indicator strip (hide if disabled)
        active && !isDisabled
          ? 'border-r-2 border-green-500 bg-green-50/60'
          : 'border-r-2 border-transparent',

        !isDisabled && danger ? 'text-red-500' : 'text-slate-700',
      ].join(' ')}
    >
      {/* Icon container */}
      <span
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200',
          isDisabled
            ? 'bg-slate-100 text-slate-400' // Neutral gray look for locked state
            : active && !danger
              ? 'bg-green-100 text-green-600'
              : danger
                ? 'bg-red-50 text-red-500'
                : 'bg-slate-100 text-slate-500',
        ].join(' ')}
      >
        {/* Clone icon with consistent sizing */}
        {icon}
      </span>

      {/* Text Blocks */}
      <div className="min-w-0 flex-1">
        <p
          className={[
            'truncate text-sm font-semibold tracking-wide',
            isDisabled
              ? 'line-through/none text-slate-500' // Muted text styling
              : active && !danger
                ? 'text-green-700'
                : danger
                  ? 'text-red-500'
                  : 'text-slate-900',
          ].join(' ')}
        >
          {title}
        </p>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs font-medium text-slate-400">
            {isDisabled ? 'Coming soon...' : subtitle}{' '}
            {/* 🌟 Dynamic Subtitle fallback */}
          </p>
        )}
      </div>

      {/* Right chevron (hidden for danger AND disabled rows to save space) */}
      {!danger && !isDisabled && (
        <svg
          className={[
            'h-4 w-4 shrink-0 transition-all duration-200',
            active ? 'text-green-500' : 'text-slate-300',
          ].join(' ')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
});

export default MenuRow;
