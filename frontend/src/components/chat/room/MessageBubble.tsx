'use client';

import { formatMessageTime } from '@/lib/timeUtils';
import useAppStore from '@/store';
import type { Message, MessageStatus } from '@/types/chat.types';
import { useContextMenuCtx } from '@/components/ui/ContextMenuProvider';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface MessageBubbleProps {
  message: Message;
}

function StatusIcon({ status }: { status: MessageStatus }) {
  if (status === 'SENDING') {
    return <Clock className="h-3 w-3 animate-pulse text-gray-300" />;
  }
  if (status === 'SENT') {
    return <Check className="h-3 w-3 text-gray-400" />;
  }
  if (status === 'DELIVERED') {
    return <CheckCheck className="h-3 w-3 text-gray-400" />;
  }
  return <CheckCheck className="h-3 w-3 text-blue-400" />;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const { isMine, content, timestamp, status } = message;

  const highlightedMessageId = useAppStore((s) => s.highlightedMessageId);
  const setHighlightedMessageId = useAppStore((s) => s.setHighlightedMessageId);
  const { openMenu } = useContextMenuCtx();

  // 🌟 FIX 1: Derive the active state directly during render (No more cascading renders!)
  const isFlashing = highlightedMessageId === message.id;
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 🌟 FIX 2: Clear old active timers strictly when this specific bubble turns active
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }

    if (isFlashing) {
      // Clean target timeout to reset store state back to normal after 2 seconds
      flashTimerRef.current = setTimeout(() => {
        setHighlightedMessageId(null);
        flashTimerRef.current = null;
      }, 2000);
    }

    // Cleanup when component unmounts
    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current = null;
      }
    };
  }, [isFlashing, setHighlightedMessageId]);

  return (
    <div
      id={`message-${message.id}`}
      className={`flex rounded-lg transition-colors duration-700 ${
        isMine ? 'justify-end' : 'justify-start'
      } ${isFlashing ? 'bg-green-200/50' : 'bg-transparent'}`}
    >
      <div
        className={[
          'group relative max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm',
          'transition-all duration-300',
          isMine
            ? 'rounded-tr-sm bg-[#d9fdd3]' // Sent
            : 'rounded-tl-sm bg-white', // Received
          isFlashing ? 'scale-[1.02]' : 'scale-100',
        ].join(' ')}
        onContextMenu={(e) => {
          e.stopPropagation(); // don't bubble to the chat background handler
          openMenu(e, 'message-bubble', {
            messageId: message.id,
            content,
            isMine,
          });
        }}
      >
        {/* Message text */}
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-gray-800">
          {content}
        </p>

        {/* Timestamp + status row */}
        <div className="mt-1 flex items-center justify-end gap-1">
          <span className="text-[10px] leading-none text-gray-400">
            {formatMessageTime(timestamp)}
          </span>
          {isMine && <StatusIcon status={status} />}
        </div>
      </div>
    </div>
  );
}
