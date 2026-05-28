'use client';

import useAppStore from '@/store';
import { useCallback, useEffect } from 'react';

/**
 * Reads the browser Notification permission on mount and syncs it to the store.
 * Also exposes a requestPermission() function that updates the store after asking.
 *
 * Returns:
 *  - permission: current NotificationPermission | 'unsupported'
 *  - isSupported: whether the Notification API exists
 *  - requestPermission: async function that asks the user and returns boolean
 */
export function useNotificationPermission() {
  const permission = useAppStore((s) => s.notificationPermission);
  const setPermission = useAppStore((s) => s.setNotificationPermission);

  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  // Sync on mount
  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, [isSupported, setPermission]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }
    if (Notification.permission === 'denied') {
      setPermission('denied');
      return false;
    }

    // Triggers the browser popup — must be called from a user gesture
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, [isSupported, setPermission]);

  return { permission, isSupported, requestPermission };
}
