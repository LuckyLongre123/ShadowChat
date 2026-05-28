/**
 * ShadowChat Service Worker
 *
 * Responsibilities:
 * 1. Handle notificationclick — navigate to the correct chat when user clicks a notification
 *    even if the browser tab is closed (opens a new tab)
 * 2. Relay NAVIGATE_TO_CHAT messages to open tabs so they can handle routing
 *
 * Note: This SW does NOT handle push events (no Web Push server configured).
 * All notification display is done via new Notification() in the main thread.
 * The SW's role here is purely the click handler and tab management.
 */

/* global clients, self */

// ── Install & Activate ────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all clients so this SW controls all open tabs immediately
  event.waitUntil(clients.claim());
});

// ── Notification Click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const chatId = event.notification.data?.chatId;
  const targetUrl = chatId
    ? `${self.location.origin}/chat?chatId=${chatId}`
    : `${self.location.origin}/chat`;

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Look for an existing open tab on our origin
        const existingClient = clientList.find(
          (client) =>
            client.url.startsWith(self.location.origin) && 'focus' in client
        );

        if (existingClient) {
          // Tab already open — focus it and send a message to navigate
          existingClient.postMessage({
            type: 'NAVIGATE_TO_CHAT',
            chatId,
          });
          return existingClient.focus();
        }

        // No existing tab — open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// ── Push (Future) ─────────────────────────────────────────────────────────────
// If you add a Web Push server later, handle push events here:
// self.addEventListener('push', (event) => { ... });
