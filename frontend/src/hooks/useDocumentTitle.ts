'use client';

import useAppStore from '@/store';
import { useEffect } from 'react';

const APP_NAME = 'ShadowChat';

/**
 * Keeps the browser tab title in sync with the total unread message count.
 *
 * When unread > 0: "(3) ShadowChat"
 * When unread = 0: "ShadowChat"
 *
 * Mount once at the app root (providers.tsx).
 */
export function useDocumentTitle() {
  const totalUnread = useAppStore((s) => s.totalUnread);

  useEffect(() => {
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) ${APP_NAME}`;
    } else {
      document.title = APP_NAME;
    }
  }, [totalUnread]);
}
