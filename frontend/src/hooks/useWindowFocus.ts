'use client';

import useAppStore from '@/store';
import { useEffect } from 'react';

/**
 * Listens to window focus/blur events and keeps the Zustand store in sync.
 *
 * window.blur fires when:
 *  - The user clicks on a different application (e.g., VS Code, Slack)
 *  - The user alt-tabs away from the browser
 *
 * Combined with usePageVisibility, this gives a complete picture of
 * "is the user actually looking at this chat right now?"
 *
 * Mount this hook once at the app root (providers.tsx).
 */
export function useWindowFocus() {
  const setWindowFocused = useAppStore((s) => s.setWindowFocused);

  useEffect(() => {
    const handleFocus = () => setWindowFocused(true);
    const handleBlur = () => setWindowFocused(false);

    // Set initial state — document.hasFocus() is true if window is currently focused
    setWindowFocused(document.hasFocus());

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [setWindowFocused]);
}
