export default function EmptyDetailView() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-20 w-20 opacity-20"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <p className="text-base font-medium">
          Select a setting to view details
        </p>
        <p className="text-sm text-slate-400">
          Choose an option from the list on the left
        </p>
      </div>
    </div>
  );
}
