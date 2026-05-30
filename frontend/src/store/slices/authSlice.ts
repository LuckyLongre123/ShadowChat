import { api } from '@/lib/axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { StateCreator } from 'zustand';
import { StoreType } from '..';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  avatar?: string;
}

export interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setLoading: (status: boolean) => void;
  setAuthUser: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// ✅ Helper — keeps cookie logic in one place
function clearSessionCookie() {
  Cookies.remove('accessToken', { path: '/' });
  // If you added the auth-session-flag from the middleware fix:
  Cookies.remove('auth-session-flag', { path: '/' });
}

const createAuthSlice: StateCreator<StoreType, [], [], AuthSlice> = (set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // ✅ Start TRUE — prevents flash of login page on app load

  setAuthUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),

  setLoading: (status) => set({ isLoading: status }),

  logout: async () => {
    // ✅ Clear local state immediately — don't wait for the network
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
    clearSessionCookie();
    set({ user: null, isAuthenticated: false, isLoading: false });

    try {
      // Fire-and-forget — we don't need the response
      // The user is already logged out locally regardless of server outcome
      await api.post('/auth/logout');
    } catch (error: unknown) {
      const isNetworkError =
        typeof error === 'object' && error !== null && !('response' in error);

      if (isNetworkError) {
        // ✅ Server unreachable — still fully logged out locally
        window.location.href = '/server-down';
        return;
      }
      // Any other error (4xx, 5xx) — still logged out, just redirect home
      console.error('Backend logout call failed:', error);
    }

    window.location.href = '/';
  },

  checkAuth: async () => {
    // ✅ Fast-exit: if there's no token, don't even hit the network
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
    }

    try {
      set({ isLoading: true });
      const response = await api.get('/auth/me');

      if (response.data?.success) {
        const userData = response.data.data?.user ?? response.data.data;
        set({ user: userData, isAuthenticated: true, isLoading: false });
        // ✅ NO window.location here — routing is handled by ChatLayout
      } else {
        // Unexpected non-success with a 2xx — treat as logged out
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
        clearSessionCookie();
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error: unknown) {
      const isNetworkError =
        typeof error === 'object' && error !== null && !('response' in error);

      if (isNetworkError) {
        // ✅ Server unreachable (Render cold start, etc.)
        // Don't delete the token — it may still be valid when server wakes
        toast.error('Server is currently unreachable. Please try again later.');
        set({ isLoading: false });
        window.location.href = '/server-down';
        return;
      }

      const status = (error as { response?: { status?: number } })?.response
        ?.status;

      if (status === 401) {
        // ✅ Explicitly invalid/expired token — clear everything
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
        clearSessionCookie();
        set({ user: null, isAuthenticated: false, isLoading: false });
        // ✅ Don't call logout() — that fires POST /auth/logout unnecessarily
        // The Axios interceptor will redirect to '/' for you
      } else {
        // 500, 503, unexpected — preserve token, just stop loading
        console.error('[checkAuth] Non-auth error, preserving session:', error);
        set({ isLoading: false });
      }
    }
  },
});

export default createAuthSlice;
