'use client';

import { PrivacyViewProps } from '@/types/setting.types';
import { ArrowLeft, Lock } from 'lucide-react';
import { memo } from 'react';
import PrivacyOptionRow from '../common/PrivacyOptionRow';

// ── PrivacyView ───────────────────────────────────────────────────────────────
const PrivacyView = memo(function PrivacyView({ onBack }: PrivacyViewProps) {
  return (
    <div className="flex h-full flex-col bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-4 shadow-sm">
        <button
          onClick={onBack}
          aria-label="Back to settings"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Privacy
          </h2>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-2xl space-y-5">
          {/* Who can see my info */}
          <div>
            <p className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Who can see my personal info
            </p>
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <PrivacyOptionRow label="Last seen and Online" value="Everyone" />
              <PrivacyOptionRow label="Profile photo" value="Everyone" />
              <PrivacyOptionRow label="About" value="Everyone" />
              <PrivacyOptionRow
                label="Status"
                value="My contacts"
                borderBottom={false}
              />
            </div>
          </div>

          {/* Disappearing messages */}
          <div>
            <p className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Disappearing messages
            </p>
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <PrivacyOptionRow
                label="Default message timer"
                value="Off"
                borderBottom={false}
              />
            </div>
          </div>

          {/* Blocked contacts */}
          <div>
            <p className="mb-2 px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Contacts
            </p>
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <PrivacyOptionRow
                label="Blocked contacts"
                value="0 blocked"
                borderBottom={false}
              />
            </div>
          </div>

          <p className="px-1 text-xs text-slate-400">
            Your privacy settings control who can see your personal information.
          </p>
        </div>
      </div>
    </div>
  );
});

export default PrivacyView;
