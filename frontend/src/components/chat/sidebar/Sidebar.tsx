'use client';

import { api } from '@/lib/axios';
import useAppStore from '@/store';
import type { FilterType, SearchUserResult } from '@/types/chat.types';
import { ArrowLeft, Loader2, MessageSquarePlus, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import UserProfile from '../../common/UserProfile';
import Avatar from '../shared/Avatar';
import ChatListItem from './ChatListItem';

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
];

const DEBOUNCE_MS = 400;

export default function Sidebar() {
  const chats = useAppStore((s) => s.chats);
  const filter = useAppStore((s) => s.filter);
  const setFilter = useAppStore((s) => s.setFilter);
  const accessChat = useAppStore((s) => s.accessChat);
  const loadChats = useAppStore((s) => s.loadChats);
  const connectSocket = useAppStore((s) => s.connectSocket);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const isChatsLoading = useAppStore((s) => s.isChatsLoading);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load chats and connect socket on initial mount
  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
      connectSocket();
    }
  }, [isAuthenticated, loadChats, connectSocket]);

  // Debounced search
  const searchUsers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(
        `/users/search?query=${encodeURIComponent(query.trim())}`
      );
      setSearchResults(response.data.data.users);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length > 0) {
      setIsSearchMode(true);
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounce timer
    debounceTimer.current = setTimeout(() => {
      searchUsers(value);
    }, DEBOUNCE_MS);
  }

  function exitSearchMode() {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchMode(false);
  }

  async function handleSearchResultClick(user: SearchUserResult) {
    exitSearchMode();
    await accessChat(user.id);
  }

  // Filter existing chats (local filter for the chat list)
  const filtered = chats.filter((chat) => {
    const matchesSearch = !isSearchMode
      ? chat.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesFilter = filter === 'all' ? true : chat.unreadCount > 0;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
        {isSearchMode ? (
          <>
            <button
              id="sidebar-back-btn"
              aria-label="Back to chats"
              onClick={exitSearchMode}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-green-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">New Chat</h1>
            <div className="w-9" />
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900">Chats</h1>
            <button
              id="sidebar-new-chat-btn"
              aria-label="New chat"
              onClick={() => {
                setIsSearchMode(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-green-600"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 pb-2">
        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            ref={searchInputRef}
            id="sidebar-search-input"
            type="text"
            placeholder={
              isSearchMode
                ? 'Search users by name or email'
                : 'Search or start new chat'
            }
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setIsSearchMode(true);
            }}
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          {isSearching && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-green-500" />
          )}
        </div>
      </div>

      {/* ── Filter Pills (hidden during search mode) ─────────────────── */}
      {!isSearchMode && (
        <div className="flex shrink-0 gap-2 px-4 pt-1 pb-2">
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              id={`filter-pill-${value}`}
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                filter === value
                  ? 'bg-green-100 text-green-700 ring-1 ring-green-300'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              } `}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Content Area ─────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isSearchMode ? (
          // ── Search Results ──
          <>
            {isSearching ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                <p className="text-sm text-gray-400">Searching users…</p>
              </div>
            ) : searchQuery.trim().length < 2 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <Search className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400">
                  Type at least 2 characters to search
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <Search className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400">No users found</p>
              </div>
            ) : (
              searchResults.map((user) => (
                <button
                  key={user.id}
                  id={`search-result-${user.id}`}
                  onClick={() => handleSearchResultClick(user)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="relative shrink-0">
                    <Avatar name={user.name} src={user.avatar} size={48} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-gray-900">
                      {user.name}
                    </span>
                    {user.email && (
                      <span className="truncate text-xs text-gray-400">
                        {user.email}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </>
        ) : (
          // ── Chat List ──
          <>
            {isChatsLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                <p className="text-sm text-gray-400">Loading chats…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <Search className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400">No chats found</p>
                <p className="text-xs text-gray-300">
                  Click the + button to start a new conversation
                </p>
              </div>
            ) : (
              filtered.map((chat) => <ChatListItem key={chat.id} chat={chat} />)
            )}
          </>
        )}
      </div>

      {/* ── Bottom User Profile Section ─────────────────────────────── */}
      <div className="shrink-0 border-t border-gray-200 bg-gray-50 p-3">
        <UserProfile />
      </div>
    </div>
  );
}
