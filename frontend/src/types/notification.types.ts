// ── Notification Preference Shape (mirrors DB / API response) ─────────────────
export interface NotificationPreferences {
  notificationsEnabled: boolean;
  desktopNotifications: boolean;
  soundEnabled: boolean;
  previewEnabled: boolean;
  muted: boolean;
}

// ── Options passed to the notification service ────────────────────────────────
export interface ShowNotificationOptions {
  /** Notification title — typically the sender's name */
  title: string;
  /** Notification body — message content or 'New message' if preview is off */
  body: string;
  /** Avatar URL for the notification icon */
  icon?: string;
  /** chatId used in onclick to navigate to the correct conversation */
  chatId: string;
  /**
   * Deduplication tag. Using the same tag for the same chat ensures new
   * messages replace (not stack) the previous notification for that chat.
   */
  tag?: string;
}

// ── Permission state (extends the browser's own NotificationPermission) ───────
export type NotificationPermissionState =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported';
