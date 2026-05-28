/**
 * Next.js App Router loading.tsx — /chat segment
 *
 * Rendered automatically as a React Suspense boundary while the /chat
 * page and its server components stream in. Eliminates the blank-screen
 * gap between navigation and client hydration.
 *
 * The same visual is shown by ChatLayout while auth.isLoading is true,
 * creating a seamless three-stage handoff:
 *
 *   [1] Next.js streaming  →  this loading.tsx shows immediately
 *   [2] JS bundle hydrated →  ChatLayout renders SplashScreen (isLoading)
 *   [3] checkAuth resolves →  Full chat UI mounts
 */
import { Loader2, MessageSquare, ShieldCheck } from 'lucide-react';

export default function ChatLoading() {
  return (
    <div
      role="status"
      aria-label="ShadowChat is initializing…"
      className="relative flex h-[100dvh] w-screen flex-col items-center justify-center overflow-hidden bg-white"
    >
      {/* ── Ambient background blobs ───────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-green-100 opacity-50 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-100 opacity-40 blur-3xl" />
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-7">

        {/* Logo lockup */}
        <div className="relative flex items-center justify-center">
          {/* Slow pulse ring */}
          <span
            aria-hidden="true"
            className="absolute h-32 w-32 animate-pulse rounded-full bg-green-100"
          />
          {/* Logo circle */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-xl shadow-green-200">
            <MessageSquare className="h-11 w-11 text-white drop-shadow" strokeWidth={1.75} />
          </div>
        </div>

        {/* App name + tagline */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            ShadowChat
          </h1>
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            <span>End-to-end encrypted</span>
          </div>
        </div>

        {/* Spinner + status text */}
        <div className="flex flex-col items-center gap-2.5">
          <Loader2
            aria-hidden="true"
            className="h-7 w-7 animate-spin text-green-500"
            strokeWidth={2.5}
          />
          <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
            Securely initializing…
          </p>
        </div>
      </div>

      {/* ── Bottom progress bar ────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden bg-gray-100"
      >
        <div className="h-full w-1/2 animate-[progress_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />
      </div>

      {/* ── Keyframe for the progress bar shimmer ─────────────────────────── */}
      <style>{`
        @keyframes progress {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
