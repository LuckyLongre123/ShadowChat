'use client';

import type { Message } from '@/types/chat.types';
import { formatMessageTime } from '@/lib/timeUtils';
import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface ChatSearchSidebarProps {
  messages: Message[];
  participantName: string;
  currentUserId: string | undefined;
  onClose: () => void;
  onResultClick: (messageId: string) => void;
}

const DEBOUNCE_MS = 300;

/**
 * Splits `text` around the first occurrence of `keyword` (case-insensitive)
 * and returns [before, match, after] so we can bold the matched portion.
 */
function splitMatch(
  text: string,
  keyword: string
): [string, string, string] | null {
  if (!keyword.trim()) return null;
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return null;
  return [
    text.slice(0, idx),
    text.slice(idx, idx + keyword.length),
    text.slice(idx + keyword.length),
  ];
}

/**
 * Returns a ≤120-char snippet centred around the match so long messages
 * don't overflow the result card.
 */
function buildSnippet(content: string, keyword: string): string {
  const idx = content.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return content.slice(0, 120);
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + keyword.length + 60);
  const snippet = content.slice(start, end);
  return (start > 0 ? '…' : '') + snippet + (end < content.length ? '…' : '');
}

export default function ChatSearchSidebar({
  messages,
  participantName,
  currentUserId,
  onClose,
  onResultClick,
}: ChatSearchSidebarProps) {
  const [rawQuery, setRawQuery] = useState('');
  const [query, setQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input as soon as the sidebar mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce the query update so filtering only runs after typing pauses
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setRawQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(val), DEBOUNCE_MS);
  }

  function handleClear() {
    setRawQuery('');
    setQuery('');
    inputRef.current?.focus();
  }

  // Memoised: only recomputes when messages array reference or query changes.
  // This prevents the expensive filter from running on every render.
  const results = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) return [];
    return messages
      .filter((m) =>
        m.content.toLowerCase().includes(trimmed.toLowerCase())
      )
      .slice()
      .reverse(); // Most recent matches first, matching WhatsApp behaviour
  }, [messages, query]);

  return (
    <aside
      id="chat-search-sidebar"
      className="flex h-full min-w-[380px] flex-col border-l border-gray-200 bg-white"
    >
      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <button
          id="search-sidebar-close-btn"
          aria-label="Close search"
          onClick={onClose}
          className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-semibold text-gray-800">Search Messages</h2>
      </div>

      {/* ── Search Input ──────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3">
        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 transition-colors focus-within:bg-gray-50 focus-within:ring-2 focus-within:ring-green-400/40">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            id="message-search-input"
            type="text"
            value={rawQuery}
            onChange={handleChange}
            placeholder="Search in conversation…"
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          {rawQuery && (
            <button
              aria-label="Clear search"
              onClick={handleClear}
              className="rounded-full p-0.5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {query.trim().length === 0 ? (
          // ── Idle State ──
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Search className="h-9 w-9 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">Find messages</p>
            <p className="px-6 text-xs text-gray-300">
              Type to search through your conversation with {participantName}
            </p>
          </div>
        ) : results.length === 0 ? (
          // ── No Match State ──
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Search className="h-9 w-9 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">No results</p>
            <p className="px-6 text-xs text-gray-300">
              No messages match &ldquo;{query.trim()}&rdquo;
            </p>
          </div>
        ) : (
          // ── Match List ──
          <div className="divide-y divide-gray-100">
            {/* Result count badge */}
            <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </p>

            {results.map((msg) => {
              const isMine = msg.senderId === currentUserId;
              const senderLabel = isMine ? 'You' : participantName;
              const snippet = buildSnippet(msg.content, query.trim());
              const parts = splitMatch(snippet, query.trim());

              return (
                <button
                  key={msg.id}
                  id={`search-result-${msg.id}`}
                  onClick={() => onResultClick(msg.id)}
                  className="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                  {/* Sender + Time row */}
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-gray-700">
                      {senderLabel}
                    </span>
                    <span className="shrink-0 text-[10px] text-gray-400">
                      {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>

                  {/* Message snippet with highlighted match */}
                  <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
                    {parts ? (
                      <>
                        {parts[0]}
                        <mark className="rounded-[2px] bg-yellow-200 px-[1px] font-semibold text-gray-800 not-italic">
                          {parts[1]}
                        </mark>
                        {parts[2]}
                      </>
                    ) : (
                      snippet
                    )}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
