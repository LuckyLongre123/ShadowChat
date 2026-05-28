import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import OfflineBanner from '@/components/shared/OfflineBanner';
import { Providers } from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ShadowChat',
  description: 'End-to-end encrypted messaging application',
};

/**
 * interactive-widget=resizes-visual — the key mobile keyboard fix.
 * Tells iOS Safari & Chrome Android to shrink only the *visual* viewport
 * when the on-screen keyboard opens, leaving the layout viewport (and our
 * fixed/sticky elements) completely undisturbed.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: 'resizes-visual',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden antialiased`}
    >
      <body className="h-full overflow-hidden">
        <Providers>
          {children}
          <OfflineBanner />
          <Toaster position="top-center" reverseOrder={false} />
        </Providers>
      </body>
    </html>
  );
}
