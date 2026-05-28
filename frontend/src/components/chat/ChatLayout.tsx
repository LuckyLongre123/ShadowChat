'use client';

import ContextMenu from '@/components/ui/ContextMenu';
import { ContextMenuProvider } from '@/components/ui/ContextMenuProvider';
import useAppStore from '@/store';
import { useEffect, useRef } from 'react';
import InstallPWA_Popup from './InstallPWA_Popup';
import ChatArea from './room/ChatArea';
import Sidebar from './sidebar/Sidebar';
import SplashScreen from './SplashScreen';

/**
 * ChatLayout — the top-level flex/grid container.
 *
 * Responsive behavior:
 * • Mobile  : Show Sidebar OR ChatArea (never both at once).
 * • Desktop : Show both panels side-by-side.
 *
 * Auth guard:
 * • While isLoading is true (Zustand resolving the /auth/me session check),
 *   render the WhatsApp-style SplashScreen instead of null/blank div.
 *   This mirrors the loading.tsx behaviour for client-side auth hydration.
 */
export default function ChatLayout() {
  const activeChatId = useAppStore((s) => s.activeChatId);
  const checkAuth = useAppStore((s) => s.checkAuth);
  const user = useAppStore((s) => s.user);
  const isLoading = useAppStore((s) => s.isLoading);
  const loadChats = useAppStore((s) => s.loadChats);
  const connectSocket = useAppStore((s) => s.connectSocket);
  const hasChatsLoaded = useAppStore((s) => s.hasChatsLoaded);

  // Track if we've already initialized for this session
  const hasInitializedRef = useRef(false);

  // Check auth on mount
  useEffect(() => {
    if (!user) {
      checkAuth();
    }
  }, [user, checkAuth]);

  // Load chats and connect socket after authentication (only once per session)
  useEffect(() => {
    if (user && user.id && !hasInitializedRef.current) {
      hasInitializedRef.current = true;

      // Only load chats if they haven't been loaded yet (caching for performance)
      if (!hasChatsLoaded) {
        loadChats().catch(console.error);
      }

      connectSocket();
    }
  }, [user?.id, hasChatsLoaded, loadChats, connectSocket]);

  // ── Auth Loading Guard ─────────────────────────────────────────────────────
  // While Zustand is resolving the /auth/me session check, render the splash
  // screen instead of a blank div. This provides a seamless transition from
  // server hydration → client auth resolution → fully hydrated chat UI.
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <ContextMenuProvider>
      <div className="relative flex h-dvh w-screen overflow-hidden bg-[#f0f2f5]">
        <InstallPWA_Popup />
        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        {/* On mobile: hidden when a chat is open; always visible on md+ */}
        <div
          className={`fixed inset-0 flex flex-col border-r border-gray-200 bg-white md:relative md:inset-auto md:h-full md:w-95 md:max-w-105 md:min-w-[320px] ${activeChatId ? 'hidden md:flex' : 'flex'}`}
        >
          <Sidebar />
        </div>

        {/* ── Chat Area ─────────────────────────────────────────────────────── */}
        {/* On mobile: hidden when no chat is open */}
        <div
          className={`fixed inset-0 flex flex-col md:relative md:inset-auto md:h-full md:flex-1 ${activeChatId ? 'flex' : 'hidden md:flex'}`}
        >
          <ChatArea />
        </div>

        {/* ── Floating context menu — rendered once at layout level ─────────── */}
        <ContextMenu />
      </div>
    </ContextMenuProvider>
  );
}
