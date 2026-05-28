import { useEffect, useState } from 'react';

/**
 * useNetworkStatus
 *
 * Tracks the browser's online/offline status in real time.
 *
 * Initialises from `navigator.onLine` (server-safe guard via
 * `typeof window !== 'undefined'`), then subscribes to the native
 * `online` / `offline` window events so the returned boolean stays
 * perfectly in sync with the actual network state.
 *
 * @returns `isOnline` — true when the browser reports connectivity.
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    // SSR guard — navigator is not available on the server
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    // Sync immediately in case the value changed between SSR and hydration
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
