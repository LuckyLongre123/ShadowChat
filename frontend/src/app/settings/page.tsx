'use client';

import SettingsLayout from '@/components/settings/SettingsLayout';
import LoaderGreen from '@/components/shared/LoaderGreen';
import useAppStore from '@/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * /app/settings/page.tsx
 *
 * Thin entry-point page. Responsibilities:
 *  1. Auth guard — redirects to "/" if not authenticated
 *  2. Render <SettingsLayout /> which owns all orchestration logic
 *
 * All layout/state logic lives in SettingsLayout — this file stays intentionally slim.
 */
export default function SettingsPage() {
  const router = useRouter();
  const user = useAppStore((st) => st.user);
  const isAuthenticated = useAppStore((st) => st.isAuthenticated);
  const isLoading = useAppStore((st) => st.isLoading);
  const checkAuth = useAppStore((st) => st.checkAuth);

  // Trigger auth check on mount if the store hasn't hydrated yet
  useEffect(() => {
    if (!user) {
      checkAuth();
    }
  }, [user, checkAuth]);

  // Redirect unauthenticated users once the loading state is resolved
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loader while auth state is being resolved
  if (isLoading || !user) {
    return <LoaderGreen />;
  }

  return <SettingsLayout />;
}
