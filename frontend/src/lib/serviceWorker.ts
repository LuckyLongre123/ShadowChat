/**
 * serviceWorker.ts — Service Worker registration utility.
 *
 * Why a Service Worker?
 * - The SW's `notificationclick` handler fires even when the browser tab is closed.
 *   It can open a new tab and navigate the user to the correct chat.
 * - Without a SW, clicking a notification while the tab is closed does nothing
 *   (the Notification API's onclick handler only works if the tab is open).
 * - The SW also provides a foundation for future background push support
 *   (Web Push Protocol) if you ever want offline notifications.
 *
 * Limitations without a push server:
 * - Browser notifications via `new Notification()` only appear when the browser is open.
 * - For true offline/closed-browser notifications you need a push server + VAPID keys.
 *   This can be added later without changing the frontend architecture.
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) {
    console.info('[SW] Service workers not supported in this browser.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.info('[SW] New service worker available. Refresh to update.');
          }
        });
      }
    });

    console.info('[SW] Service worker registered successfully:', registration.scope);
    return registration;
  } catch (err) {
    console.error('[SW] Service worker registration failed:', err);
    return null;
  }
}

/**
 * Listen for messages from the service worker (e.g., NAVIGATE_TO_CHAT).
 * The SW sends this when the user clicks a notification while another tab is open.
 */
export function listenForServiceWorkerMessages(
  onNavigate: (chatId: string) => void
): () => void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {};
  }

  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'NAVIGATE_TO_CHAT' && event.data?.chatId) {
      onNavigate(event.data.chatId);
    }
  };

  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}
