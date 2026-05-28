import { api } from '@/lib/axios';
import { NotificationPreferences } from '@/types/notification.types';
import { StateCreator } from 'zustand';
import { StoreType } from '..';

// ── Default preferences (used before API responds) ───────────────────────────
const DEFAULT_PREFERENCES: NotificationPreferences = {
  notificationsEnabled: true,
  desktopNotifications: true,
  soundEnabled: true,
  previewEnabled: true,
  muted: false,
};

export interface NotificationSlice {
  // ── Permission state ──────────────────────────────────────────────────────
  notificationPermission: NotificationPermission | 'unsupported';
  setNotificationPermission: (p: NotificationPermission | 'unsupported') => void;

  // ── User preferences (mirrors DB) ─────────────────────────────────────────
  notifPreferences: NotificationPreferences;
  isPreferencesLoading: boolean;
  fetchNotifPreferences: () => Promise<void>;
  updateNotifPreferences: (patch: Partial<NotificationPreferences>) => Promise<void>;

  // ── App visibility / focus state ─────────────────────────────────────────
  isPageVisible: boolean;
  isWindowFocused: boolean;
  setPageVisible: (v: boolean) => void;
  setWindowFocused: (v: boolean) => void;

  // ── Total unread count across all chats ───────────────────────────────────
  totalUnread: number;
  syncTotalUnread: () => void;
}

export const createNotificationSlice: StateCreator<
  StoreType,
  [],
  [],
  NotificationSlice
> = (set, get) => ({
  // ── Permission ─────────────────────────────────────────────────────────────
  notificationPermission:
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported',

  setNotificationPermission: (p) => set({ notificationPermission: p }),

  // ── Preferences ───────────────────────────────────────────────────────────
  notifPreferences: DEFAULT_PREFERENCES,
  isPreferencesLoading: false,

  fetchNotifPreferences: async () => {
    try {
      set({ isPreferencesLoading: true });
      const res = await api.get('/notifications/preferences');
      set({
        notifPreferences: res.data.data.preferences,
        isPreferencesLoading: false,
      });
    } catch (err) {
      console.error('[NotificationSlice] Failed to fetch preferences:', err);
      set({ isPreferencesLoading: false });
    }
  },

  updateNotifPreferences: async (patch) => {
    // Optimistic update — apply immediately, revert on failure
    const previous = get().notifPreferences;
    set({ notifPreferences: { ...previous, ...patch } });

    try {
      const res = await api.put('/notifications/preferences', patch);
      set({ notifPreferences: res.data.data.preferences });
    } catch (err) {
      console.error('[NotificationSlice] Failed to update preferences:', err);
      // Revert to previous on failure
      set({ notifPreferences: previous });
    }
  },

  // ── Visibility / Focus ────────────────────────────────────────────────────
  isPageVisible: typeof document !== 'undefined'
    ? document.visibilityState === 'visible'
    : true,
  isWindowFocused: true,

  setPageVisible: (v) => set({ isPageVisible: v }),
  setWindowFocused: (v) => set({ isWindowFocused: v }),

  // ── Unread count ──────────────────────────────────────────────────────────
  totalUnread: 0,

  /**
   * Derives totalUnread by summing unreadCount across all chats.
   * Call this whenever the chats array changes (done in socketSlice receive_message).
   */
  syncTotalUnread: () => {
    const { chats } = get();
    const total = chats.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
    set({ totalUnread: total });
  },
});
