'use client';

interface ToggleRowProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
}

/**
 * A toggle row matching the ShadowChat design system:
 * white card with green accent, consistent with UserInfo.tsx field rows.
 */
export default function ToggleRow({
  id,
  label,
  description,
  checked,
  disabled = false,
  onChange,
  icon,
}: ToggleRowProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 transition-opacity ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          {description && (
            <p className="mt-0.5 text-xs text-gray-400">{description}</p>
          )}
        </div>
      </div>

      {/* Toggle Switch */}
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 ${
          checked ? 'bg-green-500' : 'bg-gray-300'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
