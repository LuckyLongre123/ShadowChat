import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import createAuthSlice, { AuthSlice } from './slices/authSlice';
import createChatSlice, { ChatSlice } from './slices/chatSlice';
import {
  createNotificationSlice,
  NotificationSlice,
} from './slices/notificationSlice';
import { createSocketSlice, SocketSlice } from './slices/socketSlice';

export type StoreType = AuthSlice & ChatSlice & SocketSlice & NotificationSlice;

const useAppStore = create<StoreType>()(
  devtools(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createChatSlice(...a),
      ...createSocketSlice(...a),
      ...createNotificationSlice(...a),
    }),
    { name: 'ShadowChat-Store' }
  )
);

export default useAppStore;
