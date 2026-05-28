'use client';

import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useWindowFocus } from '@/hooks/useWindowFocus';
import {
  listenForServiceWorkerMessages,
  registerServiceWorker,
} from '@/lib/serviceWorker';
import {
  notificationService,
  registerNotificationNavigator,
} from '@/lib/notifications';
import { soundService } from '@/lib/soundService';
import useAppStore from '@/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Global providers and side-effect initializers.
 *
 * Mounted once at the app root. Responsible for:
 * 1. Initializing the Zustand store on first client render
 * 2. Registering the Service Worker for notification click handling
 * 3. Activating page visibility + window focus listeners
 * 4. Fetching notification preferences from the backend
 * 5. Keeping the browser tab title in sync with unread count
 * 6. Registering the notification navigator (for onclick → navigate to chat)
 * 7. Listening for SW → app navigation messages
 * 8. Pre-loading the notification sound for zero-delay playback
 */
function AppInitializer() {
  const router = useRouter();
  const setActiveChatId = useAppStore((s) => s.setActiveChatId);
  const accessChat = useAppStore((s) => s.accessChat);

  // ── Visibility & focus tracking ──────────────────────────────────────────
  usePageVisibility();
  useWindowFocus();

  // ── Notification preferences (fetches from backend when authenticated) ───
  useNotificationPreferences();

  // ── Browser tab title badge ──────────────────────────────────────────────
  useDocumentTitle();

  useEffect(() => {
    // ── Service worker registration ────────────────────────────────────────
    registerServiceWorker();

    // ── Pre-load notification sound so first play has no delay ────────────
    soundService.preload();

    /**
     * Register the navigation callback used by notificationService.onclick.
     * When a user clicks a notification, this opens the correct chat.
     *
     * Strategy:
     *  - Extract the chatId from the notification
     *  - Call accessChat() which handles: load messages + set activeChatId
     *  - Navigate to /chat page (where the chat UI lives)
     */
    registerNotificationNavigator((chatId: string) => {
      router.push('/chat');
      // Small delay to allow the chat page to mount before setting the active chat
      setTimeout(() => {
        accessChat(chatId);
      }, 100);
    });

    /**
     * Listen for navigation messages from the Service Worker.
     * This fires when the user clicks a notification while another tab is open:
     * The SW focuses that tab and sends a NAVIGATE_TO_CHAT message.
     */
    const cleanup = listenForServiceWorkerMessages((chatId: string) => {
      router.push('/chat');
      setTimeout(() => {
        accessChat(chatId);
      }, 100);
    });

    return cleanup;
  }, [router, setActiveChatId, accessChat]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize the store on client mount
    useAppStore.setState({});
  }, []);

  return (
    <>
      <AppInitializer />
      {children}
    </>
  );
}
