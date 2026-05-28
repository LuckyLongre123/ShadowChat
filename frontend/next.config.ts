import withPWAInit from '@ducanh2912/next-pwa';
import type { NextConfig } from 'next';

const withPWA = withPWAInit({
  dest: 'public',

  // Keep PWA disabled in development so hot-reload isn't interrupted by
  // the service worker intercepting requests.
  disable: process.env.NODE_ENV === 'development',

  // Pre-cache the app shell on install so the page loads instantly offline.
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,

  // Reload the page automatically when a new service worker takes control,
  // so users always run the latest version without a manual refresh.
  reloadOnOnline: true,

  workboxOptions: {
    // Suppress noisy "precache already registered" console warnings.
    disableDevLogs: true,

    runtimeCaching: [
      // ── 1. HTML documents — NetworkFirst ─────────────────────────────────
      // Try the network first so the user always gets fresh HTML when
      // online. Fall back to the cached copy when offline so the app shell
      // still boots.
      {
        urlPattern: /^https?:\/\/.*\/(chat|settings|server-down)?(\/.*)?$/,
        handler: 'NetworkFirst' as const,
        options: {
          cacheName: 'document-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      // ── 2. Next.js JS / CSS static assets — StaleWhileRevalidate ─────────
      // These files are content-hashed, so serving the cached version while
      // a fresh copy downloads in the background is completely safe.
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: 'StaleWhileRevalidate' as const,
        options: {
          cacheName: 'next-static-assets',
          expiration: {
            maxEntries: 256,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      // ── 3. Next.js data / RSC chunks — StaleWhileRevalidate ──────────────
      // JSON payloads produced by getServerSideProps / RSC streaming.
      // Stale-while-revalidate is appropriate: show cached data immediately
      // and refresh in the background when the network is available.
      {
        urlPattern: /\/_next\/data\/.*/i,
        handler: 'StaleWhileRevalidate' as const,
        options: {
          cacheName: 'next-data-chunks',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      // ── 4. Google Fonts stylesheets — StaleWhileRevalidate ───────────────
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'StaleWhileRevalidate' as const,
        options: {
          cacheName: 'google-fonts-stylesheets',
          expiration: {
            maxEntries: 8,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      // ── 5. Google Fonts woff2 files — CacheFirst ─────────────────────────
      // Font binaries are immutable once fetched. Cache them permanently.
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst' as const,
        options: {
          cacheName: 'google-fonts-webfonts',
          expiration: {
            maxEntries: 16,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      // ── 6. Remote images (avatars, DiceBear) — StaleWhileRevalidate ──────
      {
        urlPattern:
          /^https:\/\/(lh3\.googleusercontent\.com|api\.dicebear\.com)\/.*/i,
        handler: 'StaleWhileRevalidate' as const,
        options: {
          cacheName: 'remote-images',
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {}, // Silences Next 16 Turbopack/Webpack mismatch from next-pwa
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
};

export default withPWA(nextConfig);
