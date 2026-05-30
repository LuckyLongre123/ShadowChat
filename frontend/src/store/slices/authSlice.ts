import { api } from '@/lib/axios';
import { StateCreator } from 'zustand';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
}

export interface AuthSlice {
  authUser: AuthUser | null;
  isAuthLoading: boolean;
  setAuthUser: (user: AuthUser | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  authUser: null,
  isAuthLoading: true, // ✅ Start as TRUE — prevents flash of login page on reload

  setAuthUser: (user) => set({ authUser: user }),

  checkAuth: async () => {
    // ✅ If no token exists at all, fail fast — don't even hit the network
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ authUser: null, isAuthLoading: false });
        return;
      }
    }

    try {
      const res = await api.get('/auth/me');
      const user = res.data?.data?.user ?? res.data?.data ?? null;
      set({ authUser: user, isAuthLoading: false });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // ✅ ONLY clear token on explicit 401 (invalid/expired token)
      // Do NOT clear on network errors (500, timeout) — that would log out users on Render cold starts
      if (error?.response?.status === 401) {
        localStorage.removeItem('accessToken');
        // ✅ Clear the session flag cookie too
        document.cookie =
          'auth-session-flag=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        set({ authUser: null, isAuthLoading: false });
      } else {
        // Network error / server error — keep the user "logged in" optimistically
        // The Axios interceptor will handle true 401s
        console.warn(
          '[checkAuth] Non-401 error, preserving session:',
          error?.message
        );
        set({ isAuthLoading: false });
        // Don't touch authUser — leave it as null but don't wipe a valid token
      }
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    // ✅ Clear the session flag cookie
    if (typeof window !== 'undefined') {
      document.cookie =
        'auth-session-flag=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    set({ authUser: null, isAuthLoading: false });
    window.location.href = '/';
  },
});
