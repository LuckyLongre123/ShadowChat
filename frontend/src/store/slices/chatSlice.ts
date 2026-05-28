import { api } from '@/lib/axios';
import {
  AccessChatResponse,
  Chat,
  FilterType,
  Message,
  MessageStatus,
  ReceiveMessagePayload,
} from '@/types/chat.types';
import toast from 'react-hot-toast';
import { StateCreator } from 'zustand';
import { StoreType } from '..';

export interface ChatSlice {
  chats: Chat[];
  messagesByChat: Record<string, Message[]>;
  activeChatId: string | null;
  filter: FilterType;
  isMenuOpen: boolean;
  isChatsLoading: boolean;
  isMessagesLoading: boolean;
  hasChatsLoaded: boolean;
  isContactInfoOpen: boolean;
  /** ID of the message bubble that should flash-highlight (transient UI state) */
  highlightedMessageId: string | null;

  receiveMessage: (message: ReceiveMessagePayload) => void;
  setActiveChatId: (id: string | null) => void;
  setFilter: (filter: FilterType) => void;
  setMenuOpen: (open: boolean) => void;
  openContactInfo: () => void;
  closeContactInfo: () => void;
  toggleContactInfo: () => void;
  sendMessage: (chatId: string, content: string) => void;
  clearChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  markAsRead: (chatId: string) => void;
  loadChats: () => Promise<void>;
  /**
   * Open a chat with the given user.
   *
   * Cache-first / Stale-While-Revalidate strategy:
   * • If messages are already cached  → set activeChatId immediately (0 ms),
   *   then silently revalidate in the background (no spinner, no UI block).
   * • If NO cache exists              → show inner-chat skeleton, await API.
   */
  accessChat: (userId: string) => Promise<void>;
  setHighlightedMessageId: (id: string | null) => void;
}

/**
 * Map a raw status string from API/socket to the frontend MessageStatus type.
 */
function toMessageStatus(status?: string): MessageStatus {
  if (status === 'READ') return 'READ';
  if (status === 'DELIVERED') return 'DELIVERED';
  return 'SENT';
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const createChatSlice: StateCreator<StoreType, [], [], ChatSlice> = (
  set,
  get
) => ({
  chats: [],
  messagesByChat: {},
  activeChatId: null,
  filter: 'all',
  isMenuOpen: false,
  isChatsLoading: false,
  isMessagesLoading: false,
  hasChatsLoaded: false,
  isContactInfoOpen: false,
  highlightedMessageId: null,

  /**
   * Load all existing chats from the backend on mount.
   * Only loads if chats haven't been loaded yet (caching).
   */
  loadChats: async () => {
    // Skip if already loaded to avoid unnecessary API calls
    if (get().hasChatsLoaded) {
      return;
    }

    try {
      set({ isChatsLoading: true });
      const response = await api.get('/chats');
      const serverChats = response.data.data.chats;

      // Get online users to set correct isOnline status
      const onlineUsers = get().onlineUsers || [];

      // Map backend chats to frontend Chat shape (messages empty until opened)
      const chats: Chat[] = serverChats.map(
        (c: {
          id: string;
          participant: {
            id: string;
            name: string;
            email?: string;
            avatar?: string;
            isOnline: boolean;
          };
          lastMessage: string;
          lastMessageTime: string;
          unreadCount: number;
        }) => ({
          id: c.id,
          participant: {
            id: c.participant.id,
            name: c.participant.name,
            email: c.participant.email,
            avatar: c.participant.avatar,
            isOnline: onlineUsers.includes(c.participant.id),
          },
          lastMessage: c.lastMessage,
          lastMessageTime: c.lastMessageTime,
          unreadCount: c.unreadCount,
          messages: [],
        })
      );

      set({ chats, isChatsLoading: false, hasChatsLoaded: true });
    } catch (error: unknown) {
      console.error('Failed to load chats:', error);
      // Server returned an HTTP error — safe to surface it as a hard error.
      toast.error('Failed to load conversations');
      set({ isChatsLoading: false });
    }
  },

  /**
   * Open a chat with the given user.
   *
   * ── Strict Cache-First ────────────────────────────────────────────────────
   * CACHED  (messagesByChat[chatId].length > 0)
   *   → Set activeChatId instantly (0 ms). Return immediately.
   *     Zero network calls. Real-time freshness is guaranteed by the
   *     Socket.io `receive_message` listener which already appends every
   *     incoming message to the cache as it arrives.
   *
   * NOT CACHED
   *   → Show inner-chat skeleton (isMessagesLoading = true).
   *     Await api.post('/chats/access') to hydrate the cache from the DB.
   *     Set activeChatId + clear loading flag when data arrives.
   * ─────────────────────────────────────────────────────────────────────────
   */
  accessChat: async (userId: string) => {
    const existingChat = get().chats.find((c) => c.participant.id === userId);
    const chatId = existingChat?.id;

    // ── Determine cache state BEFORE any async work ───────────────────────
    const cachedMessages = chatId ? get().messagesByChat[chatId] : undefined;
    const hasCachedMessages = (cachedMessages?.length ?? 0) > 0;

    // ── Phase 1 — instant UI update when cache is warm ───────────────────
    if (hasCachedMessages && chatId) {
      // Open the chat immediately at 0 ms — no spinner shown.
      set({
        activeChatId: chatId,
        isMessagesLoading: false,
        isMenuOpen: false,
      });
      // Emit read receipt immediately so senders get blue ticks right away.
      get().emitMarkRead(chatId, existingChat!.participant.id);
    } else {
      // No cache — show the inner-chat skeleton loader.
      set({ isMessagesLoading: true });
    }

    // ── Cold cache: fetch from DB, populate the store, set active chat ────────
    const revalidate = async () => {
      try {
        const response = await api.post('/chats/access', { userId });
        const data: AccessChatResponse = response.data.data;
        const currentUserId = get().user?.id;
        const onlineUsers = get().onlineUsers || [];

        const formattedMessages: Message[] = data.messages.map((m) => ({
          id: m.id,
          chatId: m.chatId,
          senderId: m.senderId,
          content: m.content,
          timestamp: m.timestamp,
          status: toMessageStatus(m.status),
          isMine: m.senderId === currentUserId,
        }));

        const newChat: Chat = {
          id: data.chatId,
          participant: {
            id: data.participant.id,
            name: data.participant.name,
            email: data.participant.email,
            avatar: data.participant.avatar,
            isOnline: onlineUsers.includes(data.participant.id),
          },
          lastMessage:
            formattedMessages.length > 0
              ? formattedMessages[formattedMessages.length - 1].content
              : '',
          lastMessageTime:
            formattedMessages.length > 0
              ? formattedMessages[formattedMessages.length - 1].timestamp
              : new Date().toISOString(),
          unreadCount: 0,
          messages: formattedMessages,
        };

        set((state) => {
          const existingIdx = state.chats.findIndex(
            (c) => c.id === data.chatId
          );

          // Preserve any socket-only messages that arrived while the DB fetch
          // was in-flight (avoids race-condition duplication).
          const dbIds = new Set(formattedMessages.map((m) => m.id));
          const cached = state.messagesByChat[data.chatId] || [];
          const existingMessages: Message[] = Array.isArray(cached)
            ? cached
            : [];
          const socketOnlyMessages = existingMessages.filter(
            (m) => !dbIds.has(m.id)
          );
          const mergedMessages = [...formattedMessages, ...socketOnlyMessages];

          let updatedChats: Chat[];
          if (existingIdx >= 0) {
            updatedChats = state.chats.map((c) => {
              if (c.id !== data.chatId) return c;
              return { ...c, messages: mergedMessages, unreadCount: 0 };
            });
          } else {
            updatedChats = [
              { ...newChat, messages: mergedMessages },
              ...state.chats,
            ];
          }

          return {
            chats: updatedChats,
            messagesByChat: {
              ...state.messagesByChat,
              [data.chatId]: mergedMessages,
            },
            activeChatId: data.chatId,
            isMenuOpen: false,
            isMessagesLoading: false,
          };
        });

        // Emit mark_messages_read so the sender gets blue ticks.
        get().emitMarkRead(data.chatId, data.participant.id);
      } catch (error: unknown) {
        console.error('Failed to access chat:', error);

        // HTTP error from the server — surface it to the user.
        toast.error('Failed to open chat');
        set({ isMessagesLoading: false });
      }
    };

    if (hasCachedMessages) {
      // ── Warm cache — trust it completely, make ZERO network calls ─────────
      // Socket.io's receive_message listener keeps the cache fresh in real
      // time. An extra API round-trip here would only waste DB resources.
      return;
    }

    // ── Cold cache — block on the API, show skeleton until data arrives ─────
    await revalidate();
  },

  setActiveChatId: (id) =>
    set((state) => {
      // Mark as read when opening a chat
      const updatedChats = state.chats.map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c
      );

      // Emit mark_messages_read to the backend
      if (id) {
        const chat = state.chats.find((c) => c.id === id);
        if (chat) {
          get().emitMarkRead(id, chat.participant.id);
        }
      }

      // Close any lingering notification for this chat
      // (imported lazily to avoid circular deps at module load time)
      if (typeof window !== 'undefined') {
        import('@/lib/notifications').then(({ notificationService }) => {
          if (id) notificationService.closeForChat(id);
        });
      }

      return { 
        activeChatId: id, 
        chats: updatedChats, 
        isMenuOpen: false,
        isContactInfoOpen: false, // Close contact info when changing chats
      };
    }),

  setFilter: (filter) => set({ filter }),

  setMenuOpen: (open) => set({ isMenuOpen: open }),

  openContactInfo: () => set({ isContactInfoOpen: true }),
  closeContactInfo: () => set({ isContactInfoOpen: false }),
  toggleContactInfo: () => set((state) => ({ isContactInfoOpen: !state.isContactInfoOpen })),

  setHighlightedMessageId: (id) => set({ highlightedMessageId: id }),

  sendMessage: (chatId, content) => {
    if (!chatId) {
      console.error('sendMessage called with undefined chatId');
      return;
    }

    const chat = get().chats.find((c) => c.id === chatId);
    if (!chat) {
      console.error(`sendMessage: no chat found for chatId=${chatId}`);
      return;
    }

    const currentUserId = get().user?.id;
    if (!currentUserId) return;

    // ── 1. Generate optimistic message and append IMMEDIATELY ──
    const tempId = `msg-temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const timestamp = new Date().toISOString();

    const optimisticMessage: Message = {
      id: tempId,
      chatId,
      senderId: currentUserId,
      content,
      timestamp,
      status: 'SENDING',
      isMine: true,
    };

    set((state) => {
      const currentCache = state.messagesByChat[chatId] || [];
      return {
        chats: state.chats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: Array.isArray(c.messages)
                  ? c.messages.concat(optimisticMessage)
                  : [optimisticMessage],
                lastMessage: content,
                lastMessageTime: timestamp,
              }
            : c
        ),
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: currentCache.concat(optimisticMessage),
        },
      };
    });

    // ── 2. Fire socket emit asynchronously with ack callback ──
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit(
        'send_message',
        { receiverId: chat.participant.id, content, chatId },
        // Server ack callback — receives the real message ID + chatId
        (ack: { id: string; chatId: string; timestamp: string } | null) => {
          if (ack) {
            // Upgrade temp message → real confirmed message
            set((state) => {
              const currentCache =
                state.messagesByChat[ack.chatId] ||
                state.messagesByChat[chatId] ||
                [];
              const updatedCache = currentCache.map((m) =>
                m.id === tempId
                  ? {
                      ...m,
                      id: ack.id,
                      chatId: ack.chatId,
                      timestamp: ack.timestamp,
                      status: 'SENT' as const,
                    }
                  : m
              );

              const newMessagesByChat = { ...state.messagesByChat };
              if (chatId !== ack.chatId) delete newMessagesByChat[chatId];
              newMessagesByChat[ack.chatId] = updatedCache;

              return {
                chats: state.chats.map((c) => {
                  if (c.id !== chatId && c.id !== ack.chatId) return c;
                  return {
                    ...c,
                    id: ack.chatId, // Update chatId if it was normalized from temp_
                    messages: c.messages.map((m) =>
                      m.id === tempId
                        ? {
                            ...m,
                            id: ack.id,
                            chatId: ack.chatId,
                            timestamp: ack.timestamp,
                            status: 'SENT' as const,
                          }
                        : m
                    ),
                  };
                }),
                messagesByChat: newMessagesByChat,
                activeChatId:
                  state.activeChatId === chatId
                    ? ack.chatId
                    : state.activeChatId,
              };
            });
          } else {
            // No ack — still mark as SENT (server processed it)
            set((state) => {
              const currentCache = state.messagesByChat[chatId] || [];
              return {
                chats: state.chats.map((c) =>
                  c.id === chatId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === tempId
                            ? { ...m, status: 'SENT' as const }
                            : m
                        ),
                      }
                    : c
                ),
                messagesByChat: {
                  ...state.messagesByChat,
                  [chatId]: currentCache.map((m) =>
                    m.id === tempId ? { ...m, status: 'SENT' as const } : m
                  ),
                },
              };
            });
          }
        }
      );
    } else {
      console.warn('Socket not connected — message will appear as SENDING');
    }
  },

  clearChat: (chatId) =>
    set((state) => {
      const newCache = { ...state.messagesByChat, [chatId]: [] };
      return {
        chats: state.chats.map((c) =>
          c.id === chatId
            ? { ...c, messages: [], lastMessage: '', unreadCount: 0 }
            : c
        ),
        messagesByChat: newCache,
      };
    }),

  deleteChat: (chatId) =>
    set((state) => {
      const newCache = { ...state.messagesByChat };
      delete newCache[chatId];
      return {
        chats: state.chats.filter((c) => c.id !== chatId),
        activeChatId: state.activeChatId === chatId ? null : state.activeChatId,
        messagesByChat: newCache,
      };
    }),

  markAsRead: (chatId) =>
    set((state) => ({
      chats: state.chats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: 0 } : c
      ),
    })),

  receiveMessage: (incomingMessage) => {
    const currentUserId = get().user?.id;
    const isMine = incomingMessage.senderId === currentUserId;

    // Skip messages sent by the current user — already rendered optimistically
    // via sendMessage; processing them here would cause duplicates.
    if (isMine) return;

    const formattedMsg: Message = {
      id: incomingMessage.id,
      chatId: incomingMessage.chatId,
      senderId: incomingMessage.senderId,
      content: incomingMessage.content,
      timestamp: incomingMessage.timestamp,
      status: toMessageStatus(incomingMessage.status),
      isMine,
    };

    set((state) => {
      const existingChat = state.chats.find(
        (c) => c.id === incomingMessage.chatId
      );

      // ─── BRANCH A: Chat already exists in state ──────────────────────────
      if (existingChat) {
        const existingCache =
          state.messagesByChat[incomingMessage.chatId] ||
          existingChat.messages ||
          [];
        const existingMessages: Message[] = Array.isArray(existingCache)
          ? existingCache
          : [];

        // Deduplicate — same message ID can arrive twice during reconnects
        const isDuplicate = existingMessages.some(
          (m) => m.id === incomingMessage.id
        );
        if (isDuplicate) return state; // return unchanged state (Zustand no-op)

        const isActiveChat = state.activeChatId === incomingMessage.chatId;

        const updatedChats = state.chats.map((c) => {
          if (c.id !== incomingMessage.chatId) return c;

          const safeMessages: Message[] = Array.isArray(c.messages)
            ? c.messages
            : [];

          return {
            ...c,
            // Strict append pattern — NEVER replace the array, only extend it.
            // Optimized shallow copy with concat instead of spread syntax
            messages: safeMessages.concat(formattedMsg),
            lastMessage: incomingMessage.content,
            lastMessageTime: formattedMsg.timestamp,
            // Only increment badge when the user is NOT looking at this chat.
            // When isActiveChat, the counter stays at 0 (already reading).
            unreadCount: isActiveChat ? c.unreadCount : c.unreadCount + 1,
          };
        });

        // Auto-mark as read when the user is actively viewing the chat
        if (isActiveChat) {
          get().emitMarkRead(incomingMessage.chatId, incomingMessage.senderId);
        }

        return {
          chats: updatedChats,
          messagesByChat: {
            ...state.messagesByChat,
            [incomingMessage.chatId]: existingMessages.concat(formattedMsg),
          },
        };
      }

      // ─── BRANCH B: Unknown chat — first message from a new conversation ──
      // Build a minimal Chat shell so the message is visible in the sidebar
      // immediately. Full history will be loaded when the user opens it.
      const otherUserId = incomingMessage.senderId;
      const onlineUsers = get().onlineUsers ?? [];

      const newChat: Chat = {
        id: incomingMessage.chatId,
        participant: {
          id: otherUserId,
          name: incomingMessage.senderName || 'User',
          avatar: incomingMessage.senderAvatar ?? undefined,
          isOnline: onlineUsers.includes(otherUserId),
        },
        lastMessage: incomingMessage.content,
        lastMessageTime: formattedMsg.timestamp,
        unreadCount: 1,
        // Safe initialisation — always an array, never undefined
        messages: [formattedMsg],
      };

      // Prepend so the new conversation bubbles to the top of the sidebar
      return {
        chats: [newChat].concat(state.chats),
        messagesByChat: {
          ...state.messagesByChat,
          [incomingMessage.chatId]: [formattedMsg],
        },
      };
    });
  },
});

export default createChatSlice;
