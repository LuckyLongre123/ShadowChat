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
  logout: () => Promise<unknown>;
  checkAuth: () => Promise<void>;
}

const createAuthSlice: StateCreator<StoreType, [], [], AuthSlice> = (
  set,
  get
) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setAuthUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  setLoading: (status) => set({ isLoading: status }),
  logout: async () => {
    try {
      set({ isLoading: true });

      if (typeof window !== 'undefined') localStorage.removeItem('accessToken');
      Cookies.remove('accessToken', { path: '/' });

      await api.post('/auth/logout');
      window.location.href = '/';
    } catch (error: unknown) {
      console.error('Backend logout failed (Server might be down):', error);
      const isNetworkError =
        typeof error === 'object' &&
        error !== null &&
        'response' in error === false;
      if (isNetworkError) {
        Cookies.remove('accessToken', { path: '/' });
        window.location.href = '/server-down';
        return;
      }
      window.location.href = '/';
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        chats: [],
        hasChatsLoaded: false,
        activeChatId: null,
      });
    }
  },
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const response = await api.get('/auth/me');

      console.log('Backend Response Full Data:', response.data);

      if (response.data?.success) {
        const userData = response.data.data?.user || response.data.data;

        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        });

        if (window.location.pathname === '/') {
          window.location.href = '/chat';
        }
      } else {
        const { logout } = get();
        await logout();
      }
    } catch (error: unknown) {
      // Existing catch handling logs perfectly...
      console.error('checkAuth error: ', error);
      const isNetworkError =
        typeof error === 'object' && error !== null && !('response' in error);

      if (isNetworkError) {
        toast.error('Server is currently unreachable. Please try again later.');
        set({ isLoading: false, isAuthenticated: false });
        window.location.href = '/server-down';
        return;
      }
      const { logout } = get();
      await logout();
    }
  },
});

export default createAuthSlice;
