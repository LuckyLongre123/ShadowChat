'use client';

import useAppStore from '@/store';
import { Paperclip, Send } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

interface ChatInputProps {
  chatId: string;
}

export default function ChatInput({ chatId }: ChatInputProps) {
  const sendMessage = useAppStore((s) => s.sendMessage);
  const isConnected = useAppStore((s) => s.isConnected);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasContent = value.trim().length > 0;

  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 10);

    return () => clearTimeout(focusTimeout);
  }, [chatId]);

  function handleSend() {
    if (!hasContent) return;

    // sendMessage in chatSlice now delegates to socket internally
    sendMessage(chatId, value.trim());
    setValue('');

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    // Refocus after sending
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Auto-grow textarea up to ~5 lines
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    // Reset height first to shrink correctly
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  return (
    <div className="relative shrink-0 bg-white pb-[env(safe-area-inset-bottom)]">
      {/* Connection status indicator — floats above the input bar */}
      {!isConnected && (
        <div className="absolute right-0 bottom-full left-0 flex items-center justify-center bg-yellow-50 px-3 py-1">
          <span className="text-xs text-yellow-700">Connecting…</span>
        </div>
      )}
      <div className="flex items-end gap-2 border-t border-gray-200 px-4 py-3">
        {/* Attachment button */}
        <button
          id="chat-attach-btn"
          disabled
          aria-label="Attach file"
          className={[
            'mb-1 shrink-0 rounded-full p-2 transition-all duration-200',
            'text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:bg-gray-200',
            'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400',
          ].join(' ')}
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Text input */}
        <div className="flex flex-1 items-end rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 transition-colors focus-within:border-green-400 focus-within:bg-white">
          <textarea
            ref={inputRef}
            id="chat-message-input"
            rows={1}
            autoFocus
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            className="max-h-30 min-h-6 w-full resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            style={{ lineHeight: '1.5rem' }}
          />
        </div>

        {/* Send button — only visible when typing */}
        <button
          id="chat-send-btn"
          aria-label="Send message"
          onClick={handleSend}
          disabled={!hasContent}
          className={`mb-1 shrink-0 rounded-full p-2 transition-all ${
            hasContent
              ? 'scale-100 bg-green-500 text-white shadow-md hover:bg-green-600 active:scale-95'
              : 'scale-75 cursor-default bg-gray-200 text-gray-400 opacity-0'
          } `}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
