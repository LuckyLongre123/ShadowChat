// src/components/notifications/NotificationSettings.tsx
'use client';

import PermissionStatusCard from '@/components/notifications/PermissionStatusCard';
import ToggleRow from '@/components/notifications/ToggleRow';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { notificationService } from '@/lib/notifications';
import { soundService } from '@/lib/soundService';
import useAppStore from '@/store';
import {
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Monitor,
  Volume2,
  VolumeX,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationSettings() {
  const { permission } = useNotificationPermission();
  const notifPreferences = useAppStore((s) => s.notifPreferences);
  const isPreferencesLoading = useAppStore((s) => s.isPreferencesLoading);
  const updateNotifPreferences = useAppStore((s) => s.updateNotifPreferences);

  const handleTestNotification = () => {
    if (permission !== 'granted') {
      toast.error('Please allow notifications first');
      return;
    }
    if (!notifPreferences.notificationsEnabled) {
      toast.error('Notifications are disabled in settings');
      return;
    }
    if (notifPreferences.muted) {
      toast.error('Notifications are muted');
      return;
    }

    notificationService.show(
      {
        title: 'ShadowChat Test',
        body: notifPreferences.previewEnabled
          ? '👋 This is what your notifications look like!'
          : 'You have a new message',
        icon: '/icon-192x192.png',
        chatId: 'test-notification',
        tag: 'shadowchat-test',
      },
      notifPreferences
    );

    soundService.play(notifPreferences.soundEnabled, notifPreferences.muted);
    toast.success('Test notification sent!');
  };

  if (isPreferencesLoading) {
    return (
      <div className="flex h-full min-h-75 flex-col items-center justify-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
          <Loader2 className="h-6 w-6 animate-spin text-green-500" />
        </div>
        <span className="text-sm font-medium text-slate-500">
          Syncing preferences…
        </span>
      </div>
    );
  }

  const isMasterDisabled = !notifPreferences.notificationsEnabled;

  return (
    <div className="flex h-full flex-col space-y-6 sm:space-y-8">
      {/* 🌟 Section Header */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-green-100/50 bg-linear-to-br from-green-100 to-green-50 shadow-sm">
          <Bell className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Notification Settings
          </h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">
            Control how and when you receive alerts
          </p>
        </div>
      </div>

      <PermissionStatusCard />

      {/* 🌟 Settings Container with subtle background separation */}
      <div className="rounded-3xl border border-slate-100 bg-slate-50/30 p-2 sm:p-4">
        {/* ── Master Toggle ── */}
        <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm transition-all">
          <ToggleRow
            id="toggle-notifications-enabled"
            label="Enable All Notifications"
            description="Master switch to turn alerts on or off globally"
            checked={notifPreferences.notificationsEnabled}
            icon={
              notifPreferences.notificationsEnabled ? (
                <Bell className="h-5 w-5 text-green-600" />
              ) : (
                <BellOff className="h-5 w-5 text-slate-400" />
              )
            }
            onChange={(v) =>
              updateNotifPreferences({ notificationsEnabled: v })
            }
          />
        </div>

        {/* ── Sub-Settings List ── */}
        <div
          className={`space-y-2 transition-opacity duration-300 ${isMasterDisabled ? 'pointer-events-none opacity-50' : 'opacity-100'}`}
        >
          <div className="rounded-2xl border border-slate-100 bg-white p-2 transition-all hover:border-green-100">
            <ToggleRow
              id="toggle-desktop-notifications"
              label="Desktop Alerts"
              description="Show pop-up alerts on your system screen"
              checked={notifPreferences.desktopNotifications}
              disabled={isMasterDisabled}
              icon={
                <Monitor
                  className={`h-5 w-5 ${notifPreferences.desktopNotifications ? 'text-blue-500' : 'text-slate-400'}`}
                />
              }
              onChange={(v) =>
                updateNotifPreferences({ desktopNotifications: v })
              }
            />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-2 transition-all hover:border-green-100">
            <ToggleRow
              id="toggle-sound-enabled"
              label="In-App Sounds"
              description="Play a tone when a new message arrives"
              checked={notifPreferences.soundEnabled}
              disabled={isMasterDisabled}
              icon={
                notifPreferences.soundEnabled ? (
                  <Volume2 className="h-5 w-5 text-indigo-500" />
                ) : (
                  <VolumeX className="h-5 w-5 text-slate-400" />
                )
              }
              onChange={(v) => updateNotifPreferences({ soundEnabled: v })}
            />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-2 transition-all hover:border-green-100">
            <ToggleRow
              id="toggle-preview-enabled"
              label="Message Preview"
              description="Show sender name & message in the pop-up"
              checked={notifPreferences.previewEnabled}
              disabled={isMasterDisabled}
              icon={
                notifPreferences.previewEnabled ? (
                  <Eye className="h-5 w-5 text-amber-500" />
                ) : (
                  <EyeOff className="h-5 w-5 text-slate-400" />
                )
              }
              onChange={(v) => updateNotifPreferences({ previewEnabled: v })}
            />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-2 transition-all hover:border-green-100">
            <ToggleRow
              id="toggle-muted"
              label="Mute Temporarily"
              description="Silently suppress alerts without disabling them"
              checked={notifPreferences.muted}
              disabled={isMasterDisabled}
              icon={
                <MessageSquare
                  className={`h-5 w-5 ${notifPreferences.muted ? 'text-rose-500' : 'text-slate-400'}`}
                />
              }
              onChange={(v) => updateNotifPreferences({ muted: v })}
            />
          </div>
        </div>
      </div>

      {/* Spacer to push button to bottom if needed */}
      <div className="grow"></div>

      {/* ── Test Notification Button ── */}
      <button
        id="test-notification-btn"
        onClick={handleTestNotification}
        disabled={isMasterDisabled || permission !== 'granted'}
        className="group flex w-full items-center justify-center gap-2.5 rounded-2xl border border-green-200/60 bg-green-50 px-4 py-4 text-[15px] font-bold text-green-700 transition-all hover:bg-green-100 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 sm:py-3.5"
      >
        <Bell className="h-4 w-4 transition-transform group-hover:rotate-12 group-disabled:rotate-0" />
        <span>Test Notification Setup</span>
      </button>
    </div>
  );
}
