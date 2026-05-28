'use client';

import useAppStore from '@/store';
import { useEffect } from 'react';

/**
 * Fetches notification preferences from the backend on mount (if authenticated).
 * Preferences are stored in Zustand and used by the notification service.
 *
 * Mount once at the app root (providers.tsx) so preferences are always fresh.
 */
export function useNotificationPreferences() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const fetchNotifPreferences = useAppStore((s) => s.fetchNotifPreferences);
  const notifPreferences = useAppStore((s) => s.notifPreferences);
  const isPreferencesLoading = useAppStore((s) => s.isPreferencesLoading);
  const updateNotifPreferences = useAppStore((s) => s.updateNotifPreferences);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifPreferences();
    }
  }, [isAuthenticated, fetchNotifPreferences]);

  return {
    preferences: notifPreferences,
    isLoading: isPreferencesLoading,
    update: updateNotifPreferences,
  };
}
