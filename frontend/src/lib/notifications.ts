/**
 * notificationService — Production-grade browser notification manager.
 *
 * Key design decisions:
 * - Uses `tag` per chatId so new messages REPLACE (not stack) old notifications
 * - Debounces per chatId to prevent spam from rapid incoming messages
 * - Stores active Notification references to allow programmatic close
 * - onclick navigates to the correct chat using router from a stored callback
 * - Falls back gracefully if Notification API is not supported
 */

import { NotificationPreferences, ShowNotificationOptions } from '@/types/notification.types';

// Stored by the provider so the service can trigger navigation on click
let _navigateToChat: ((chatId: string) => void) | null = null;

export function registerNotificationNavigator(fn: (chatId: string) => void) {
  _navigateToChat = fn;
}

class NotificationService {
  /** Active notifications keyed by chatId — prevents duplicates */
  private activeNotifications = new Map<string, Notification>();

  /** Last notification timestamp per chatId — for debouncing */
  private lastNotificationTime = new Map<string, number>();

  /** Minimum ms between notifications for the same chat */
  private readonly DEBOUNCE_MS = 2500;

  /** Auto-close duration in ms */
  private readonly AUTO_CLOSE_MS = 5000;

  /**
   * Show a browser notification if all conditions are met:
   *  - Permission is granted
   *  - Notifications are globally enabled in preferences
   *  - Not muted
   *  - Not debounced (prevents rapid repeat for same chat)
   *  - Desktop notifications are enabled in preferences
   */
  show(opts: ShowNotificationOptions, prefs: NotificationPreferences): void {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (!prefs.notificationsEnabled) return;
    if (!prefs.desktopNotifications) return;
    if (prefs.muted) return;

    // Debounce: skip if we showed a notification for this chat too recently
    if (this.shouldDebounce(opts.chatId)) return;

    // Close any existing notification for this chat before showing a new one
    this.closeForChat(opts.chatId);

    try {
      const notification = new Notification(opts.title, {
        body: opts.body,
        icon: opts.icon || '/icon-192x192.png',
        // tag replaces the previous notification with the same tag in the system tray
        tag: opts.tag ?? `shadowchat-${opts.chatId}`,
        // badge is the small icon shown in Android notification bar
        badge: '/icon-72x72.png',
        // silent=false — let the OS play a sound (we control our own audio separately)
        silent: false,
        // requireInteraction=false — notification auto-closes
        requireInteraction: false,
      });

      this.activeNotifications.set(opts.chatId, notification);
      this.lastNotificationTime.set(opts.chatId, Date.now());

      // Auto-close after timeout
      const timer = setTimeout(() => {
        notification.close();
        this.activeNotifications.delete(opts.chatId);
      }, this.AUTO_CLOSE_MS);

      notification.onclose = () => {
        clearTimeout(timer);
        this.activeNotifications.delete(opts.chatId);
      };

      notification.onclick = () => {
        notification.close();
        this.activeNotifications.delete(opts.chatId);

        // Focus the browser window / tab
        if (typeof window !== 'undefined') {
          window.focus();
        }

        // Navigate to the specific chat
        if (_navigateToChat) {
          _navigateToChat(opts.chatId);
        }
      };

      notification.onerror = () => {
        console.error('[NotificationService] Failed to show notification');
        this.activeNotifications.delete(opts.chatId);
      };
    } catch (err) {
      console.error('[NotificationService] Error creating notification:', err);
    }
  }

  /** Close all active notifications (e.g., when user logs out or opens app) */
  closeAll(): void {
    this.activeNotifications.forEach((n) => n.close());
    this.activeNotifications.clear();
  }

  /** Close the notification for a specific chat (e.g., user opened that chat) */
  closeForChat(chatId: string): void {
    const existing = this.activeNotifications.get(chatId);
    if (existing) {
      existing.close();
      this.activeNotifications.delete(chatId);
    }
  }

  /**
   * Returns true if we showed a notification for this chat within DEBOUNCE_MS.
   * Prevents notification spam when multiple messages arrive in rapid succession.
   */
  private shouldDebounce(chatId: string): boolean {
    const last = this.lastNotificationTime.get(chatId);
    if (!last) return false;
    return Date.now() - last < this.DEBOUNCE_MS;
  }
}

/** Singleton instance — import this directly in any file */
export const notificationService = new NotificationService();
