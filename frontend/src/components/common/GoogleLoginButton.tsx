'use client';

import { api } from '@/lib/axios';
import { auth, googleProvider } from '@/lib/firebase';
import useAppStore from '@/store';
import { signInWithPopup } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

// ✅ Helper to set the lightweight session flag cookie for middleware
function setSessionCookie() {
  // Not httpOnly (set from JS), expires in 7 days, works cross-path
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `auth-session-flag=true; path=/; expires=${expires}; SameSite=Lax`;
}

export default function GoogleLoginButton() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const setAuthUser = useAppStore((state) => state.setAuthUser);

  const handleGoogleLogin = async () => {
    try {
      setIsAuthenticating(true);

      // Step 1: Firebase popup
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // Step 2: Exchange with your backend
      const res = await api.post('/auth/google', { idToken });

      if (!res.data?.success) {
        throw new Error(res?.data?.message || 'Server authentication failed.');
      }

      // Step 3: Safe token + user extraction
      const token = res.data.data?.token ?? res.data.token;
      const user = res.data.data?.user ?? res.data.data;

      if (!token) {
        throw new Error('Token missing from server response');
      }

      // Step 4: Persist token to localStorage (for Axios interceptor)
      localStorage.setItem('accessToken', token);

      // ✅ Step 5: Set the session flag cookie (for Next.js Middleware routing)
      setSessionCookie();

      // Step 6: Hydrate Zustand state
      setAuthUser(user);

      // ✅ Step 7: Hard redirect — middleware will now see the cookie and allow /chat
      window.location.href = '/chat';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Google Login Error:', error);

      const firebaseErrors: Record<string, string> = {
        'auth/popup-closed-by-user': 'Login cancelled: Popup was closed.',
        'auth/cancelled-popup-request': 'Only one popup can be open at a time.',
        'auth/network-request-failed': 'Network error. Check your connection.',
      };

      const message =
        firebaseErrors[error.code] ||
        error?.response?.data?.message ||
        error.message ||
        'Failed to login. Please try again.';

      toast.error(message);
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
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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
