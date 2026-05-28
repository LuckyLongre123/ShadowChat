'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import useAppStore from '@/store';
import type { Chat } from '@/types/chat.types';
import { useContextMenuCtx } from '@/components/ui/ContextMenuProvider';
import Avatar from '../shared/Avatar';
import { formatRelativeTime } from '@/lib/timeUtils';

interface ChatListItemProps {
  chat: Chat;
}

export default function ChatListItem({ chat }: ChatListItemProps) {
  const activeChatId = useAppStore((s) => s.activeChatId);
  const isMessagesLoading = useAppStore((s) => s.isMessagesLoading);
  const accessChat = useAppStore((s) => s.accessChat);
  const [isOpening, setIsOpening] = useState(false);
  const { openMenu } = useContextMenuCtx();

  const isActive = activeChatId === chat.id;
  const { participant, lastMessage, lastMessageTime, unreadCount } = chat;

  async function handleClick() {
    // The store's accessChat owns all cache-first / SWR logic:
    // • Warm cache  → activeChatId set at 0 ms, API fires silently in background.
    // • Cold cache  → isMessagesLoading = true (spinner in ChatArea), then await.
    setIsOpening(true);
    try {
      await accessChat(participant.id);
    } finally {
      setIsOpening(false);
    }
  }

  // We only show the loader if this item is clicked and the store confirms it is fetching from the API
  const showLoader = isOpening && isMessagesLoading;

  return (
    <button
      id={`chat-list-item-${chat.id}`}
      onClick={handleClick}
      onContextMenu={(e) =>
        openMenu(e, 'chat-item', { chatId: chat.id, participantName: participant.name })
      }
      className={`
        flex w-full items-center gap-3 px-4 py-3 text-left transition-colors
        ${isActive ? 'bg-green-50' : 'hover:bg-gray-50'}
      `}
    >
      {/* Avatar with online indicator */}
      <div className="relative shrink-0">
        <Avatar
          name={participant.name}
          src={participant.avatar}
          size={48}
        />
        {participant.isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline justify-between gap-1">
          <span className="truncate text-sm font-semibold text-gray-900">
            {participant.name}
          </span>
          <span
            className={`shrink-0 text-xs ${unreadCount > 0 ? 'font-semibold text-green-600' : 'text-gray-400'}`}
          >
            {formatRelativeTime(lastMessageTime)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-xs text-gray-500">{lastMessage || '\u00A0'}</p>
          {showLoader ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-green-500" />
          ) : unreadCount > 0 ? (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
