/**
 * Returns a human-readable relative time string.
 * Matches WhatsApp's convention:
 *  - Same day  → "HH:MM" (24-hr)
 *  - Yesterday → "Yesterday"
 *  - Same week → Day name ("Mon", "Tue", …)
 *  - Older     → "DD/MM/YYYY"
 */
export function formatRelativeTime(isoString: string): string {
  if (!isoString) return '';

  const date = new Date(isoString);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);

  if (date >= startOfToday) {
    // Same day → time
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } else if (date >= startOfYesterday) {
    return 'Yesterday';
  } else if (date >= startOfWeek) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

/**
 * Formats a timestamp for individual message bubbles: "HH:MM"
 */
export function formatMessageTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Returns a date label for message groups (e.g. "Today", "Yesterday", "Mon 19 May")
 */
export function formatDateLabel(isoString: string): string {
  if (!isoString) return '';

  const date = new Date(isoString);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'long' });
}
