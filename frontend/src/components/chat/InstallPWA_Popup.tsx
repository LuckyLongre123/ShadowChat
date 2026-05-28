'use client';

import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'pwa-install-dismissed';

export default function InstallPWA_Popup() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(DISMISSED_KEY) === 'true';
    }
    return true; // SSR Server safe default
  });

  const [delayPassed, setDelayPassed] = useState(false);

  useEffect(() => {
    if (isInstallable && !isInstalled && !isDismissed) {
      const timer = setTimeout(() => {
        setDelayPassed(true);
      }, 2000);

      // Cleanup ensures if component unmounts before 2s, we don't set state.
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, isDismissed]);

  // Derived visibility computed purely from current reactive values
  const isVisible =
    isInstallable && !isInstalled && !isDismissed && delayPassed;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  const handleInstall = async () => {
    await installApp();
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 p-4 sm:right-auto sm:bottom-4 sm:left-1/2 sm:w-96 sm:-translate-x-1/2">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-900/5">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100">
              <Download className="h-6 w-6 text-green-600" />
            </div>

            <div className="flex-1 pt-1">
              <h3 className="text-base font-semibold text-gray-900">
                Install ShadowChat
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get the full experience. Install the app for faster access, push
                notifications, and offline support.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              onClick={handleDismiss}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Not Now
            </button>
            <button
              onClick={handleInstall}
              className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-600 active:scale-95"
            >
              Install App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
