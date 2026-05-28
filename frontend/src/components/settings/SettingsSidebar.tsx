'use client';

import useAppStore from '@/store';
import { SettingsSidebarProps } from '@/types/setting.types';
import {
  ArrowLeft,
  Bell,
  HelpCircle,
  Key,
  Lock,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import toast from 'react-hot-toast';
import Avatar from '../shared/Avatar';
import MenuRow from './common/MenuRow';

// ── SettingsSidebar ────────────────────────────────────────────────────────────
// Memoized — only re-renders when activeTab or onTabSelect change
const SettingsSidebar = memo(function SettingsSidebar({
  activeTab,
  onTabSelect,
}: SettingsSidebarProps) {
  const router = useRouter();
  const user = useAppStore((st) => st.user);
  const logout = useAppStore((st) => st.logout);

  const handleLogout = async () => {
    const logoutPromise = logout();
    toast.promise(logoutPromise, {
      loading: 'Logging out…',
      success: 'Logged out successfully!',
      error: 'Failed to logout. Try again.',
    });
    await logoutPromise;
    router.push('/');
  };

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-4">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold tracking-tight text-slate-900">
          Settings
        </h1>
      </div>

      {/* ── Profile Summary Card ────────────────────────────────────────────── */}
      {user && (
        <button
          onClick={() => onTabSelect('profile')}
          aria-label="Edit profile"
          className={[
            'flex w-full cursor-pointer items-center gap-4 px-5 py-4',
            'text-left transition-all duration-200 hover:bg-slate-50',
            activeTab === 'profile'
              ? 'border-r-2 border-green-500 bg-green-50/60'
              : 'border-r-2 border-transparent',
          ].join(' ')}
        >
          {/* Avatar with priority (it's above-the-fold) */}
          <Avatar name={user.name} src={user.avatar} size={52} />

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-slate-900">
              {user.name}
            </p>
            <p className="truncate text-sm text-slate-500">
              {user.phone ?? user.email ?? 'Available'}
            </p>
          </div>

          {/* Pen icon */}
          <svg
            className="h-4 w-4 shrink-0 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      )}

      <div className="mx-4 border-t border-slate-100" />

      {/* ── Navigation Items ─────────────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto py-2"
        aria-label="Settings navigation"
      >
        <MenuRow
          id="notifications"
          icon={<Bell className="h-5 w-5" />}
          title="Notifications"
          subtitle="Message, group & call tones"
          active={activeTab === 'notifications'}
          onSelect={onTabSelect}
        />
        <MenuRow
          id="privacy"
          icon={<Lock className="h-5 w-5" />}
          title="Privacy"
          subtitle="Blocked contacts, disappearing messages"
          active={activeTab === 'privacy'}
          onSelect={onTabSelect}
        />

        {/* Separator */}
        <div className="mx-5 my-2 border-t border-slate-100" />

        <MenuRow
          id={null}
          icon={<Key className="h-5 w-5" />}
          title="Account"
          subtitle="Security notifications, change number"
          active={false}
          onSelect={() => {}} // placeholder — not yet implemented
        />
        <MenuRow
          id={null}
          icon={<MessageSquare className="h-5 w-5" />}
          title="Chats"
          subtitle="Theme, wallpapers, chat history"
          active={false}
          onSelect={() => {}} // placeholder
        />
        <MenuRow
          id={null}
          icon={<HelpCircle className="h-5 w-5" />}
          title="Help"
          subtitle="Help centre, contact us, privacy policy"
          active={false}
          onSelect={() => {}} // placeholder
        />

        <div className="mx-5 my-2 border-t border-slate-100" />

        {/* Logout — not a SettingsTab; fires action directly */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-4 px-5 py-3.5 text-left text-red-500 transition-all duration-200 hover:bg-red-50 active:bg-red-100"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
            <LogOut className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold">Log out</p>
        </button>
      </nav>

      {/* ── App Version Watermark ────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 px-6 py-4 text-center">
        <p className="text-[11px] text-slate-400">ShadowChat v1.0.0</p>
      </div>
    </div>
  );
});

export default SettingsSidebar;
