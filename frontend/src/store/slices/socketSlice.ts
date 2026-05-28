import { notificationService } from '@/lib/notifications';
import { soundService } from '@/lib/soundService';
import { io, Socket } from 'socket.io-client';
import { StateCreator } from 'zustand';
import { StoreType } from '..';

export interface SocketSlice {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
  sendSocketMessage: (
    receiverId: string,
    content: string,
    chatId: string
  ) => void;
  emitMarkRead: (chatId: string, senderId: string) => void;
}

export const createSocketSlice: StateCreator<StoreType, [], [], SocketSlice> = (
  set,
  get
) => ({
  socket: null,
  isConnected: false,
  onlineUsers: [],

  connectSocket: () => {
    const { isAuthenticated, socket } = get();

    if (!isAuthenticated || socket?.connected) return;

    const newSocket = io(
      process.env.NEXT_PUBLIC_BACKEND_URI || 'http://10.196.247.106:5000',
      {
        withCredentials: true,
        transports: ['websocket'],
      }
    );

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      set({ isConnected: true });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({ isConnected: false });
    });

    // ── Message Events ──────────────────────────────────────────────────
    newSocket.on('receive_message', (message) => {
      console.log('New Message arrived:', message);
      const {
        receiveMessage,
        activeChatId,
        isPageVisible,
        isWindowFocused,
        notifPreferences,
        syncTotalUnread,
      } = get();

      receiveMessage(message);

      // Keep unread count + tab title in sync
      syncTotalUnread();

      /**
       * Notification decision logic:
       *
       * Show notification if ALL of the following are true:
       *  1. The incoming message is for a different chat than the one currently open,
       *     OR the page is not visible, OR the window is not focused.
       * (i.e., the user is NOT actively watching that specific conversation)
       */
      const isViewingThisChat =
        activeChatId === message.chatId && isPageVisible && isWindowFocused;

      if (!isViewingThisChat) {
        // Show browser notification (respects all user preferences internally)
        notificationService.show(
          {
            title: message.senderName || 'New Message',
            body: notifPreferences.previewEnabled
              ? message.content.length > 100
                ? message.content.slice(0, 100) + '…'
                : message.content
              : 'You have a new message',
            icon: message.senderAvatar || undefined,
            chatId: message.chatId,
            tag: `shadowchat-${message.chatId}`,
          },
          notifPreferences
        );

        // Play notification sound (respects soundEnabled + muted preferences)
        soundService.play(
          notifPreferences.soundEnabled,
          notifPreferences.muted
        );
      } else {
        // User is actively viewing this chat — close any lingering notification for it
        notificationService.closeForChat(message.chatId);
      }
    });

    // ── Online/Offline Presence ─────────────────────────────────────────
    newSocket.on('get_online_users', (data: { onlineUsers: string[] }) => {
      set({ onlineUsers: data.onlineUsers });
      // Update isOnline flag in existing chats
      set((state) => ({
        chats: state.chats.map((chat) => ({
          ...chat,
          participant: {
            ...chat.participant,
            isOnline: data.onlineUsers.includes(chat.participant.id),
          },
        })),
      }));
    });

    newSocket.on('user_online', (data: { userId: string }) => {
      set((state) => {
        const alreadyOnline = state.onlineUsers.includes(data.userId);
        const updatedOnline = alreadyOnline
          ? state.onlineUsers
          : [...state.onlineUsers, data.userId];

        return {
          onlineUsers: updatedOnline,
          chats: state.chats.map((chat) =>
            chat.participant.id === data.userId
              ? {
                  ...chat,
                  participant: { ...chat.participant, isOnline: true },
                }
              : chat
          ),
        };
      });
    });

    newSocket.on('user_offline', (data: { userId: string }) => {
      set((state) => ({
        onlineUsers: state.onlineUsers.filter((id) => id !== data.userId),
        chats: state.chats.map((chat) =>
          chat.participant.id === data.userId
            ? {
                ...chat,
                participant: {
                  ...chat.participant,
                  isOnline: false,
                  lastSeen: new Date().toISOString(),
                },
              }
            : chat
        ),
      }));
    });

    // ── Read Receipts ───────────────────────────────────────────────────
    newSocket.on(
      'messages_read',
      (data: { chatId: string; readBy: string }) => {
        set((state) => ({
          chats: state.chats.map((chat) => {
            if (chat.id !== data.chatId) return chat;
            return {
              ...chat,
              messages: chat.messages.map((msg) =>
                msg.isMine && msg.status !== 'READ'
                  ? { ...msg, status: 'READ' as const }
                  : msg
              ),
            };
          }),
        }));
      }
    );

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();

    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, onlineUsers: [] });
    }
  },

  sendSocketMessage: (receiverId, content, chatId) => {
    const { socket } = get();

    if (socket && socket.connected) {
      socket.emit('send_message', { receiverId, content, chatId });
    } else {
      console.warn('Socket not connected — message not sent');
    }
  },

  emitMarkRead: (chatId, senderId) => {
    const { socket } = get();

    if (socket && socket.connected) {
      socket.emit('mark_messages_read', { chatId, senderId });
    }
  },
});
