'use client';

import { AlertCircle, RefreshCw, ServerCrash } from 'lucide-react';
import { useState } from 'react';

export default function ServerDownPage() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.href = '/chat';
    }, 1500);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-gray-900/5">
        {/* Animated Icon Container */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-red-500">
          <ServerCrash className="h-12 w-12" strokeWidth={1.5} />
        </div>

        {/* Text Content */}
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
          Server Unreachable
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-500">
          We&apos;re having trouble connecting to the ShadowChat servers. Our
          team is likely performing maintenance or there&apos;s a network
          glitch. Please try again in a few moments.
        </p>

        {/* Status Indicator */}
        <div className="mb-8 flex items-center justify-center gap-2 rounded-full bg-gray-50 py-2 text-xs font-medium text-gray-600 ring-1 ring-gray-200 ring-inset">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span>Error 500: Connection Refused</span>
        </div>

        {/* Retry Button */}
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isRetrying ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <RefreshCw className="h-5 w-5 transition-transform group-hover:rotate-180" />
          )}
          {isRetrying ? 'Reconnecting...' : 'Try Reconnecting'}
        </button>
      </div>

      {/* Footer Branding */}
      <div className="mt-8 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} ShadowChat. All systems monitored.
      </div>
    </div>
  );
}
