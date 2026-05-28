'use client';

import useAppStore from '@/store';
import { Bell, BellOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * A banner that prompts the user to enable browser notifications.
 *
 * Chrome requires a USER GESTURE (click) to show the real permission popup.
 * That's why we can't call Notification.requestPermission() from useEffect.
 *
 * Enhanced behaviour:
 * - Checks both browser permission AND the user's notificationsEnabled preference
 * - Dismissal is persisted in sessionStorage so it doesn't re-appear on every render
 * - Does not show if the user has already disabled notifications in settings
 */
export default function NotificationPermissionBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const notifPreferences = useAppStore((s) => s.notifPreferences);
  const setNotificationPermission = useAppStore((s) => s.setNotificationPermission);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    // Don't show if user explicitly disabled notifications in their settings
    if (!notifPreferences.notificationsEnabled) return;

    // Don't show if already dismissed this session
    if (sessionStorage.getItem('notif-banner-dismissed') === '1') return;

    if (Notification.permission === 'default') {
      setShowBanner(true);
      setIsDenied(false);
    } else if (Notification.permission === 'denied') {
      setShowBanner(true);
      setIsDenied(true);
    }
    // 'granted' → no banner needed
  }, [notifPreferences.notificationsEnabled]);

  const handleAllow = async () => {
    if (!('Notification' in window)) return;

    const result = await Notification.requestPermission();
    setNotificationPermission(result);

    if (result === 'granted') {
      setShowBanner(false);
    } else {
      setIsDenied(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('notif-banner-dismissed', '1');
  };

  if (!showBanner) return null;

  return (
    <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 animate-slide-down">
      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        {/* Icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isDenied ? 'bg-red-100' : 'bg-green-100'
          }`}
        >
          {isDenied ? (
            <BellOff className="h-5 w-5 text-red-500" />
          ) : (
            <Bell className="h-5 w-5 text-green-600" />
          )}
        </div>

        {/* Text */}
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">
            {isDenied ? 'Notifications Blocked' : 'Enable Notifications'}
          </span>
          <span className="text-xs text-gray-500">
            {isDenied
              ? 'Click 🔒 in the URL bar → Allow notifications'
              : 'Get alerts when new messages arrive'}
          </span>
        </div>

        {/* Allow Button (only if not yet denied) */}
        {!isDenied && (
          <button
            id="banner-allow-notifications-btn"
            onClick={handleAllow}
            className="ml-3 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-600 active:bg-green-700"
          >
            Allow
          </button>
        )}

        {/* Dismiss */}
        <button
          id="banner-dismiss-btn"
          onClick={handleDismiss}
          className="ml-1 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Dismiss notification banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
