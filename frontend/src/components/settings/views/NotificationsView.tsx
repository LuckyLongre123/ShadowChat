'use client';

import ToggleRow from '@/components/notifications/ToggleRow';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import useAppStore from '@/store';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BellOff,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { memo, useState } from 'react';

// ── Props ─────────────────────────────────────────────────────────────────────
interface NotificationsViewProps {
  /** Mobile: go back to the sidebar list */
  onBack: () => void;
}

// ── Section wrapper card ──────────────────────────────────────────────────────
const SectionCard = memo(function SectionCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
});

// ── Static "sub-menu" row (Messages, Calls, etc.) ─────────────────────────────
const SubMenuRow = memo(function SubMenuRow({
  icon,
  label,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
}) {
  return (
    <button className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50 active:bg-slate-100">
      <div className="flex items-center gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </span>
        <div>
          <p className="text-sm font-medium text-slate-900">{label}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </button>
  );
});

// ── BrowserPermissionBanner ───────────────────────────────────────────────────
/**
 * Renders a contextual, animated banner based on the browser's current
 * notification permission state:
 *
 *  'default'     → Prompt card with "Allow Notifications" CTA that triggers
 *                  the browser's native permission dialog on click.
 *  'denied'      → Step-by-step manual instructions to unblock via browser UI.
 *  'granted'     → Compact success confirmation (auto-dismisses visual weight).
 *  'unsupported' → Informational card; no action possible.
 */
const BrowserPermissionBanner = memo(function BrowserPermissionBanner() {
  const { permission, isSupported, requestPermission } =
    useNotificationPermission();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequest = async () => {
    setIsRequesting(true);
    await requestPermission();
    setIsRequesting(false);
  };

  // ── Unsupported ────────────────────────────────────────────────────────────
  if (!isSupported) {
    return (
      <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200">
          <BellOff className="h-5 w-5 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">
            Notifications Not Supported
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Your browser does not support desktop notifications. Try using a
            modern browser like Chrome, Edge, or Firefox.
          </p>
        </div>
      </div>
    );
  }

  // ── Granted ────────────────────────────────────────────────────────────────
  if (permission === 'granted') {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-green-200 bg-green-50 px-5 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-green-800">
            Browser Notifications Allowed
          </p>
          <p className="text-xs text-green-600">
            ShadowChat can send you desktop alerts for new messages.
          </p>
        </div>
      </div>
    );
  }

  // ── Denied ─────────────────────────────────────────────────────────────────
  if (permission === 'denied') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
        {/* Title row */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <BellOff className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800">
              Notifications Blocked by Browser
            </p>
            <p className="mt-0.5 text-xs text-red-600">
              You previously denied permission. Follow these steps to re-enable:
            </p>
          </div>
        </div>

        {/* Step-by-step instructions */}
        <ol className="mt-4 space-y-2 pl-1">
          {[
            <>
              Click the <strong>🔒 lock icon</strong> in your browser&apos;s
              address bar
            </>,
            <>
              Select <strong>Site settings</strong> (or Permissions)
            </>,
            <>
              Find <strong>Notifications</strong> and set it to{' '}
              <strong>Allow</strong>
            </>,
            <>Refresh this page — the banner will update automatically</>,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-[10px] font-bold text-red-700">
                {i + 1}
              </span>
              <p className="text-xs leading-5 text-red-700">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  // ── Default (never asked) ──────────────────────────────────────────────────
  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-linear-to-br from-blue-50 to-indigo-50 px-5 py-5 shadow-sm">
      {/* Decorative background ring */}
      <div className="pointer-events-none absolute -top-6 -right-6 h-28 w-28 rounded-full bg-blue-100 opacity-50" />
      <div className="pointer-events-none absolute -right-2 -bottom-4 h-16 w-16 rounded-full bg-indigo-100 opacity-60" />

      <div className="relative flex items-start gap-4">
        {/* Pulsing bell icon */}
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <Bell className="h-6 w-6 text-blue-600" />
          {/* Ripple animation */}
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-300 opacity-30" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-blue-500" />
            <p className="text-[11px] font-semibold tracking-wide text-blue-500 uppercase">
              Permission Required
            </p>
          </div>
          <p className="mt-1 text-sm font-bold text-blue-900">
            Allow Notifications for ShadowChat
          </p>
          <p className="mt-0.5 text-xs text-blue-700">
            Get instant desktop alerts when new messages arrive, even when
            you&apos;re in another tab.
          </p>

          {/* CTA button */}
          <button
            id="grant-notification-permission-btn"
            onClick={handleRequest}
            disabled={isRequesting}
            aria-label="Allow browser notifications"
            className={[
              'mt-4 flex min-h-10 items-center gap-2 rounded-xl px-5 py-2.5',
              'text-sm font-semibold text-white shadow-md',
              'transition-all duration-200 active:scale-95',
              isRequesting
                ? 'cursor-not-allowed bg-blue-400'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg',
            ].join(' ')}
          >
            {isRequesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Waiting for browser…</span>
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                <span>Allow Notifications</span>
              </>
            )}
          </button>

          <p className="mt-2 text-[11px] text-blue-500">
            A browser prompt will appear — click &quot;Allow&quot; to confirm.
          </p>
        </div>
      </div>
    </div>
  );
});

// ── NotificationsView (main export) ──────────────────────────────────────────
const NotificationsView = memo(function NotificationsView({
  onBack,
}: NotificationsViewProps) {
  const notifPreferences = useAppStore((s) => s.notifPreferences);
  const updateNotifPreferences = useAppStore((s) => s.updateNotifPreferences);

  const masterEnabled = notifPreferences.notificationsEnabled;

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-4 shadow-sm">
        {/* Back button — mobile only */}
        <button
          onClick={onBack}
          aria-label="Back to settings"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Notifications
          </h2>
        </div>
      </div>

      {/* ── Scrollable Content ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-2xl space-y-5">
          {/* ── Browser permission banner (context-aware) ─────────────────── */}
          <BrowserPermissionBanner />

          {/* ── Master toggle ─────────────────────────────────────────────── */}
          <SectionCard>
            <div className="p-2">
              <ToggleRow
                id="master-notif"
                label="Enable Notifications"
                description="Turn all alerts on or off globally"
                checked={masterEnabled}
                onChange={(v) =>
                  updateNotifPreferences({ notificationsEnabled: v })
                }
              />
            </div>
          </SectionCard>

          {/* ── Detailed toggles — faded + non-interactive when master is off */}
          <div
            className={`space-y-5 transition-opacity duration-300 ${
              !masterEnabled ? 'pointer-events-none opacity-40' : 'opacity-100'
            }`}
            aria-hidden={!masterEnabled}
          >
            {/* Sub-menus (static navigation, WhatsApp style) */}
            <SectionCard>
              <SubMenuRow
                icon={<MessageSquare className="h-4 w-4" />}
                label="Messages"
                subtitle="Tones, desktop alerts"
              />
              <div className="mx-5 border-t border-slate-100" />
              <SubMenuRow
                icon={
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                }
                label="Calls"
                subtitle="Ringtone, vibration"
              />
            </SectionCard>

            {/* Fine-grained preference toggles */}
            <SectionCard>
              <div className="divide-y divide-slate-100">
                <div className="p-3">
                  <ToggleRow
                    id="show-previews"
                    label="Show message previews"
                    description="Preview message text inside notifications"
                    checked={notifPreferences.previewEnabled}
                    disabled={!masterEnabled}
                    onChange={(v) =>
                      updateNotifPreferences({ previewEnabled: v })
                    }
                  />
                </div>
                <div className="p-3">
                  <ToggleRow
                    id="play-sounds"
                    label="Play sound for messages"
                    description="Audible alert for incoming messages"
                    checked={notifPreferences.soundEnabled}
                    disabled={!masterEnabled}
                    onChange={(v) =>
                      updateNotifPreferences({ soundEnabled: v })
                    }
                  />
                </div>
                <div className="p-3">
                  <ToggleRow
                    id="desktop-alerts"
                    label="Desktop alerts"
                    description="Show pop-up notifications on your screen"
                    checked={notifPreferences.desktopNotifications}
                    disabled={!masterEnabled}
                    onChange={(v) =>
                      updateNotifPreferences({ desktopNotifications: v })
                    }
                  />
                </div>
              </div>
            </SectionCard>

            {/* Footer note */}
            <p className="px-1 text-xs text-slate-400">
              To receive notifications, ensure they&apos;re enabled in your
              browser and operating system settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default NotificationsView;
