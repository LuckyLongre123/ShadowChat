'use client';

import useAppStore from '@/store';
import { useEffect } from 'react';

/**
 * Listens to the Page Visibility API and keeps the Zustand store in sync.
 *
 * document.visibilityState === 'hidden' fires when:
 *  - The user switches to another tab
 *  - The browser is minimized
 *  - The screen is locked (mobile)
 *
 * Mount this hook once at the app root (providers.tsx).
 */
export function usePageVisibility() {
  const setPageVisible = useAppStore((s) => s.setPageVisible);

  useEffect(() => {
    const handleChange = () => {
      setPageVisible(document.visibilityState === 'visible');
    };

    // Set initial state
    setPageVisible(document.visibilityState === 'visible');

    document.addEventListener('visibilitychange', handleChange);
    return () => document.removeEventListener('visibilitychange', handleChange);
  }, [setPageVisible]);
}
