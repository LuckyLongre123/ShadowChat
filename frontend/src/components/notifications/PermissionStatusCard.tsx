'use client';

import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { AlertTriangle, Bell, BellOff, CheckCircle2, Info } from 'lucide-react';

/**
 * Displays the current browser notification permission status with
 * contextual instructions for the user. Matches the ShadowChat card style.
 */
export default function PermissionStatusCard() {
  const { permission, isSupported, requestPermission } = useNotificationPermission();

  if (!isSupported) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Not Supported</p>
          <p className="mt-0.5 text-xs text-amber-600">
            Your browser does not support desktop notifications.
          </p>
        </div>
      </div>
    );
  }

  if (permission === 'granted') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
        <div>
          <p className="text-sm font-semibold text-green-800">
            Notifications Enabled
          </p>
          <p className="mt-0.5 text-xs text-green-600">
            You will receive desktop notifications for new messages.
          </p>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
        <BellOff className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-semibold text-red-800">
            Notifications Blocked
          </p>
          <p className="mt-1 text-xs text-red-600">
            To enable notifications, click the 🔒 lock icon in your browser&apos;s
            address bar → <strong>Site settings</strong> → set{' '}
            <strong>Notifications</strong> to <strong>Allow</strong>, then
            refresh the page.
          </p>
        </div>
      </div>
    );
  }

  // permission === 'default' — never asked
  return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-blue-800">
          Permission Required
        </p>
        <p className="mt-0.5 text-xs text-blue-600">
          Allow notifications to receive desktop alerts for new messages.
        </p>
        <button
          id="grant-notification-permission-btn"
          onClick={requestPermission}
          className="mt-3 flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-600 active:scale-95"
        >
          <Bell className="h-3.5 w-3.5" />
          Allow Notifications
        </button>
      </div>
    </div>
  );
}
