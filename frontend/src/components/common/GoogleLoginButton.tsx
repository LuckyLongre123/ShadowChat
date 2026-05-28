'use client';

import { api } from '@/lib/axios';
import { auth, googleProvider } from '@/lib/firebase';
import useAppStore from '@/store';
import { signInWithPopup } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function GoogleLoginButton() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const setAuthUser = useAppStore((state) => state.setAuthUser);

  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      setIsAuthenticating(true);
      const result = await signInWithPopup(auth, googleProvider);

      const idToken = await result.user.getIdToken();

      const res = await api.post('/auth/google', { idToken });

      if (res.data?.success) {
        setAuthUser(res.data.data.user);
        router.push('/chat');
      } else
        throw new Error(res?.data?.message || 'Server authentication failed.');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Google Login Error Details:', error);

      // 4. SPECIFIC ERROR HANDLING (Firebase & Backend Errors)
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Login cancelled: Popup was closed.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        toast.error('Only one popup can be opened at a time.');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Network error. Check your internet connection.');
      } else {
        const errorMessage =
          error?.response?.data?.message ||
          error.message ||
          'Failed to login. Please try again.';
        toast.error(errorMessage);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={isAuthenticating}
      className="flex w-full cursor-pointer items-center justify-center space-x-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isAuthenticating ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin text-green-600" />
          <span>Authenticating...</span>
        </>
      ) : (
        <>
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="font-semibold text-gray-600">
            Continue with Google
          </span>
        </>
      )}
    </button>
  );
}
