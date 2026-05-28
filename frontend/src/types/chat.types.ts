// ─── Chat Domain Types ────────────────────────────────────────────────────────

export interface ChatUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string; // URL or undefined → show initials
  isOnline: boolean;
  lastSeen?: string; // ISO date string
}

export type MessageStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ';

export interface Message {
  id: string;
  chatId: string;
  senderId: string; // matches ChatUser.id
  content: string;
  timestamp: string; // ISO date string
  status: MessageStatus;
  isMine: boolean; // pre-computed: true if sent by the logged-in user
}

export type FilterType = 'all' | 'unread';

export interface Chat {
  id: string;
  participant: ChatUser; // one-to-one chat
  lastMessage: string;
  lastMessageTime: string; // ISO date string
  unreadCount: number;
  isPinned?: boolean;
  messages: Message[];
}

export interface SendMessagePayload {
  receiverId: string;
  content: string;
  chatId: string;
}

export interface ReceiveMessagePayload {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  receiverId: string;
  content: string;
  chatId: string;
  timestamp: string;
  status: string;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface SearchUserResult {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface AccessChatResponse {
  chatId: string;
  isNewChat: boolean;
  participant: SearchUserResult;
  messages: {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    chatId: string;
    status: string;
    timestamp: string;
  }[];
}

export interface UserChatsResponse {
  chats: {
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
  }[];
}
