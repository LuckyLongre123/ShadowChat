'use client';

import { usePWAInstall } from '@/hooks/usePWAInstall';
import useAppStore from '@/store';
import { Download, MessageSquare } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ContactInfoSidebar from '../ContactInfoSidebar';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ChatSearchSidebar from './ChatSearchSidebar';
import MessageList from './MessageList';

export default function ChatArea() {
  const activeChatId = useAppStore((s) => s.activeChatId);
  const chats = useAppStore((s) => s.chats);
  const isMessagesLoading = useAppStore((s) => s.isMessagesLoading);
  const accessChat = useAppStore((s) => s.accessChat);
  const setHighlightedMessageId = useAppStore((s) => s.setHighlightedMessageId);
  const user = useAppStore((s) => s.user);
  const isContactInfoOpen = useAppStore((s) => s.isContactInfoOpen);

  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  const activeChat = chats.find((c) => c.id === activeChatId);

  // ── Local UI state — search sidebar open/closed ─────────────────────────
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const closeContactInfo = useAppStore((s) => s.closeContactInfo);

  // Close sidebar whenever the active chat changes
  const prevChatIdRef = useRef(activeChatId);
  useEffect(() => {
    if (prevChatIdRef.current !== activeChatId) {
      setIsSearchOpen(false);
      prevChatIdRef.current = activeChatId;
    }
  }, [activeChatId]);

  const toggleSearch = useCallback(() => setIsSearchOpen((prev) => !prev), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  // Refetch messages if chat is opened but messages are empty
  useEffect(() => {
    if (!activeChat || activeChat.messages.length > 0) return;
    const participantId = activeChat.participant.id;
    if (participantId) {
      accessChat(participantId);
    }
  }, [activeChatId, activeChat, accessChat]);

  /**
   * Called when the user clicks a result in ChatSearchSidebar.
   *
   * On mobile the sidebar covers the whole screen, so we close it first so
   * the user can see the scrolled-to message. On desktop we leave it open.
   *
   * We use requestAnimationFrame to ensure the DOM has re-painted (sidebar
   * unmounted / message visible) before we call scrollIntoView.
   */
  const handleResultClick = useCallback(
    (messageId: string) => {
      // Detect mobile (< md breakpoint = 768px)
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setIsSearchOpen(false);
      }

      // Highlight in store — MessageBubble listens and applies the flash class
      setHighlightedMessageId(messageId);

      // Wait for any layout changes to settle before scrolling
      requestAnimationFrame(() => {
        const el = document.getElementById(`message-${messageId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },
    [setHighlightedMessageId]
  );

  // ── Empty State ───────────────────────────────────────────────────────────
  if (!activeChat) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#f0f2f5]">
        {/* WhatsApp-style decorative lock icon panel */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md">
            <MessageSquare className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-light text-gray-700">ShadowChat Web</h2>
          <p className="max-w-xs text-sm text-gray-400">
            Select a conversation from the left to start messaging.
            <br />
            Your messages are end-to-end encrypted.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
          <span className="inline-block h-3 w-3 rounded-full bg-green-400" />
          End-to-end encrypted
        </div>

        {/* ── Inline PWA Install Prompt ────────────────────────────────────── */}
        {isInstallable && !isInstalled && (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5 transition-all hover:shadow-md">
            <p className="text-sm font-medium text-gray-700">
              Download ShadowChat for Desktop/Mobile for faster access.
            </p>
            <button
              onClick={installApp}
              className="flex items-center gap-2 rounded-full bg-green-50 px-5 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 active:bg-green-200"
            >
              <Download className="h-4 w-4 text-red-800" />
              Install App
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Loading State ──────────────────────────────────────────────────────────
  if (isMessagesLoading && activeChat.messages.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <ChatHeader
          chat={activeChat}
          onSearchToggle={toggleSearch}
          isSearchOpen={isSearchOpen}
        />
        <div className="flex min-h-0 flex-1 items-center justify-center bg-[#efeae2]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-green-500" />
            <p className="text-sm text-gray-500">Loading messages...</p>
          </div>
        </div>
        <ChatInput chatId={activeChat.id} />
      </div>
    );
  }

  // ── Active Chat ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {/* Main Chat Area (Flex-1) */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header — always shrink-0 / sticky */}
        <ChatHeader
          chat={activeChat}
          onSearchToggle={toggleSearch}
          isSearchOpen={isSearchOpen}
        />

        {/*
         * Horizontal split row:
         *   MessageList  | ChatSearchSidebar (when open)
         *
         * overflow-hidden on the row is mandatory — it clips the sidebar
         * slide-in animation without breaking the vertical flex chain above.
         */}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <MessageList
            messages={activeChat.messages}
            onSearchToggle={toggleSearch}
          />

          {/*
           * Sidebar is ALWAYS mounted so the CSS width transition actually plays.
           * Width toggles between 0 (collapsed) and 380px (open) on desktop,
           * and between 0 and 100% on mobile.
           * overflow-hidden on this wrapper clips content when collapsed.
           * The inner <aside> has min-w-[380px] so content never compresses
           * during the tween — it simply slides in/out of the clipping rect.
           */}
          <div
            className={[
              'overflow-hidden transition-all duration-300 ease-in-out',
              // Desktop: fixed 380px column; Mobile: full-width overlay
              isSearchOpen ? 'w-full md:w-95' : 'w-0',
            ].join(' ')}
          >
            <ChatSearchSidebar
              messages={activeChat.messages}
              participantName={activeChat.participant.name}
              currentUserId={user?.id}
              onClose={closeSearch}
              onResultClick={handleResultClick}
            />
          </div>
        </div>

        {/* Bottom input bar — always shrink-0 */}
        <ChatInput chatId={activeChat.id} />
      </div>

      {/* Right Sidebar: Contact Info */}
      <div
        className={[
          'shrink-0 overflow-hidden transition-all duration-300 ease-in-out',
          isContactInfoOpen ? 'w-100' : 'w-0',
        ].join(' ')}
      >
        <ContactInfoSidebar
          onSearchClick={() => {
            setIsSearchOpen(true);
            closeContactInfo();
          }}
        />
      </div>
    </div>
  );
}
