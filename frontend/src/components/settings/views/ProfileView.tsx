'use client';

import useAppStore from '@/store';
import { ArrowLeft, Camera, Pen } from 'lucide-react';
import Image from 'next/image';
import { memo, useState } from 'react';

// ── Props ────────────────────────────────────────────────────────────────────
interface ProfileViewProps {
  /** Called by the back button (mobile only) */
  onBack: () => void;
}

// ── Field Row: reusable profile info card ─────────────────────────────────────
const ProfileField = memo(function ProfileField({
  label,
  value,
  hint,
  editable = true,
}: {
  label: string;
  value: string;
  hint?: string;
  editable?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <div className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Label */}
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-600">
        {label}
      </p>

      {editing ? (
        /* Edit mode */
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
          />
          <button
            onClick={() => setEditing(false)}
            aria-label="Save"
            className="h-8 rounded-lg bg-green-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-green-600"
          >
            Save
          </button>
          <button
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            aria-label="Cancel"
            className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        /* View mode */
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-base text-slate-900">{draft}</p>
            {hint && (
              <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
            )}
          </div>
          {editable && (
            <button
              onClick={() => setEditing(true)}
              aria-label={`Edit ${label}`}
              className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-green-600"
            >
              <Pen className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
});

// ── Avatar Section ─────────────────────────────────────────────────────────────
const AvatarSection = memo(function AvatarSection({
  name,
  avatar,
}: {
  name: string;
  avatar?: string;
}) {
  const getInitials = (n: string) =>
    n
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="mb-10 flex justify-center">
      <div className="relative h-36 w-36">
        {/* Avatar circle */}
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-4 border-white bg-green-100 text-5xl font-bold text-green-600 shadow-lg ring-2 ring-green-200">
          {avatar ? (
            <Image
              src={avatar}
              alt={`${name}'s avatar`}
              fill
              sizes="144px"
              className="object-cover"
              priority // Above-the-fold avatar — load with priority
            />
          ) : (
            <span>{getInitials(name)}</span>
          )}
        </div>

        {/* Edit camera button — WhatsApp-style floating pill */}
        <button
          aria-label="Change profile photo"
          className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:bg-green-600 hover:shadow-lg active:scale-95"
        >
          <Camera className="h-3.5 w-3.5" />
          <span>Edit</span>
        </button>
      </div>
    </div>
  );
});

// ── ProfileView (main export) ─────────────────────────────────────────────────
// Reads directly from Zustand — no prop-drilling of user data
const ProfileView = memo(function ProfileView({ onBack }: ProfileViewProps) {
  // Fine-grained selectors to avoid re-renders from unrelated store changes
  const user = useAppStore((st) => st.user);

  if (!user) return null;

  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-4 shadow-sm">
        {/* Back button — visible only on mobile */}
        <button
          onClick={onBack}
          aria-label="Back to settings"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Edit Profile
        </h2>
      </div>

      {/* ── Scrollable Content ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Avatar */}
          <AvatarSection name={user.name} avatar={user.avatar} />

          {/* Profile Fields */}
          <div className="space-y-4">
            <ProfileField
              label="About"
              value="Available"
              hint="Until you change it"
            />
            <ProfileField
              label="Name"
              value={user.name}
              hint="This name will be visible to your contacts."
            />
            <ProfileField
              label="Phone / Email"
              value={user.phone ?? user.email ?? '—'}
              editable={false}
            />
          </div>

          {/* Info note */}
          <p className="mt-6 px-1 text-xs text-slate-400">
            Your profile information is end-to-end encrypted. Only you and your
            contacts can see it.
          </p>
        </div>
      </div>
    </div>
  );
});

export default ProfileView;
