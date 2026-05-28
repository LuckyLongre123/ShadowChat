'use client';

import type { Message } from '@/types/chat.types';
import { formatDateLabel } from '@/lib/timeUtils';
import { useContextMenuCtx } from '@/components/ui/ContextMenuProvider';
import useAppStore from '@/store';
import MessageBubble from './MessageBubble';
import { useEffect, useRef } from 'react';

interface MessageListProps {
  messages: Message[];
  /** Forwarded from ChatArea so the context menu can toggle the search sidebar */
  onSearchToggle: () => void;
}

/**
 * Groups messages by calendar day so we can render date separators.
 */
function groupByDate(messages: Message[]) {
  const groups: { dateLabel: string; messages: Message[] }[] = [];
  let currentLabel = '';

  for (const msg of messages) {
    const label = formatDateLabel(msg.timestamp);
    if (label !== currentLabel) {
      groups.push({ dateLabel: label, messages: [msg] });
      currentLabel = label;
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }
  return groups;
}

export default function MessageList({ messages, onSearchToggle }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeChatId = useAppStore((s) => s.activeChatId);
  const { openMenu } = useContextMenuCtx();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const groups = groupByDate(messages);

  return (
    <div
      id="message-list"
      className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3"
      onContextMenu={(e) =>
        openMenu(e, 'chat-background', {
          chatId: activeChatId ?? undefined,
          onSearchToggle,
        })
      }
      style={{
        // Classic WhatsApp chat background with a subtle dot pattern
        background: `
          radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)
          0 0 / 20px 20px,
          #efeae2
        `,
      }}
    >
      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="rounded-full bg-white/80 px-4 py-2 text-xs text-gray-400 shadow-sm">
            No messages yet. Say hello! 👋
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {groups.map((group) => (
            <div key={group.dateLabel}>
              {/* Date Separator */}
              <div className="my-3 flex items-center justify-center">
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
                  {group.dateLabel}
                </span>
              </div>

              {/* Messages in this day group */}
              <div className="flex flex-col gap-1">
                {group.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
