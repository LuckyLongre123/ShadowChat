'use client';

import useAppStore from '@/store';
import type { Chat } from '@/types/chat.types';
import Avatar from '../shared/Avatar';
import { Search, MoreVertical, ArrowLeft, Info, X, Trash2, MessageSquareX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ChatHeaderProps {
  chat: Chat;
  onSearchToggle: () => void;
  isSearchOpen: boolean;
}

const MENU_ITEMS = [
  { id: 'contact-info', label: 'Contact info', icon: Info },
  { id: 'close-chat', label: 'Close chat', icon: X },
  { id: 'clear-chat', label: 'Clear chat', icon: MessageSquareX },
  { id: 'delete-chat', label: 'Delete chat', icon: Trash2, danger: true },
];

export default function ChatHeader({ chat, onSearchToggle, isSearchOpen }: ChatHeaderProps) {
  const setActiveChatId = useAppStore((s) => s.setActiveChatId);
  const clearChat = useAppStore((s) => s.clearChat);
  const deleteChat = useAppStore((s) => s.deleteChat);
  const toggleContactInfo = useAppStore((s) => s.toggleContactInfo);
  const openContactInfo = useAppStore((s) => s.openContactInfo);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  function handleMenuAction(id: string) {
    setMenuOpen(false);
    switch (id) {
      case 'contact-info':
        openContactInfo();
        break;
      case 'close-chat':
        setActiveChatId(null);
        break;
      case 'clear-chat':
        clearChat(chat.id);
        break;
      case 'delete-chat':
        deleteChat(chat.id);
        break;
    }
  }

  const { participant } = chat;
  const statusText = participant.isOnline
    ? 'Online'
    : participant.lastSeen
      ? `Last seen at ${new Date(participant.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : 'Offline';

  return (
    <header className="sticky top-0 z-50 flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
      {/* Back button (mobile only) */}
      <button
        id="chat-back-btn"
        aria-label="Back to chats"
        onClick={() => setActiveChatId(null)}
        className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 md:hidden"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {/* Avatar + info */}
      <div 
        className="flex flex-1 items-center gap-3 overflow-hidden cursor-pointer"
        onClick={toggleContactInfo}
      >
        <div className="relative shrink-0">
          <Avatar name={participant.name} src={participant.avatar} size={40} />
          {participant.isOnline && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {participant.name}
          </p>
          <p className={`text-xs ${participant.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
            {statusText}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Search toggle — opens/closes the ChatSearchSidebar */}
        <button
          id="chat-search-btn"
          aria-label={isSearchOpen ? 'Close search' : 'Search messages'}
          aria-pressed={isSearchOpen}
          onClick={onSearchToggle}
          className={`rounded-full p-2 transition-colors hover:bg-gray-100 ${
            isSearchOpen ? 'bg-gray-100 text-green-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Three-dot menu */}
        <div ref={menuRef} className="relative">
          <button
            id="chat-menu-btn"
            aria-label="More options"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`rounded-full p-2 transition-colors hover:bg-gray-100 ${menuOpen ? 'bg-gray-100 text-gray-700' : 'text-gray-500'}`}
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl"
            >
              {MENU_ITEMS.map(({ id, label, icon: Icon, danger }) => (
                <button
                  key={id}
                  id={`menu-item-${id}`}
                  role="menuitem"
                  onClick={() => handleMenuAction(id)}
                  className={`
                    flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors
                    ${danger
                      ? 'text-red-500 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
