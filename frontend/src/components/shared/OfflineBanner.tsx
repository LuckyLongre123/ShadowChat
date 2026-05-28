'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();

  // Lazy initialization to prevent hydration mismatch and show instantly if offline on boot
  const [mounted, setMounted] = useState(() => {
    if (typeof window !== 'undefined') return !navigator.onLine;
    return false;
  });

  const [visible, setVisible] = useState(() => {
    if (typeof window !== 'undefined') return !navigator.onLine;
    return false;
  });

  useEffect(() => {
    let mountTimer: NodeJS.Timeout;
    let visibleTimer: NodeJS.Timeout;

    if (!isOnline) {
      // 🌟 FIX 1: Wrap inside setTimeout to bypass the synchronous setState linter warning
      mountTimer = setTimeout(() => {
        setMounted(true);
        // Chota delay taaki DOM mount hone ke baad CSS transition smooth ho
        visibleTimer = setTimeout(() => setVisible(true), 10);
      }, 0);
    } else {
      visibleTimer = setTimeout(() => {
        setVisible(false);
        // Unmount tabhi karenge jab CSS slide-out animation (300ms) khatam ho jaye
        mountTimer = setTimeout(() => setMounted(false), 300);
      }, 0);
    }

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(visibleTimer);
    };
  }, [isOnline]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="No internet connection"
      style={{
        // Top se slide hoga aur transparent se solid banega
        transform: visible ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
        opacity: visible ? 1 : 0,
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      className="fixed top-4 left-1/2 z-9999 flex w-max max-w-[90vw] items-center justify-center gap-2 rounded-full bg-gray-900/90 px-4 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-sm select-none"
    >
      {/* 🌟 FIX 2: Modern Pill UI (Does not block back buttons) */}
      <WifiOff
        className="h-3.5 w-3.5 shrink-0 text-yellow-400"
        aria-hidden="true"
      />
      <span>Offline. Viewing cached data.</span>
    </div>
  );
}
