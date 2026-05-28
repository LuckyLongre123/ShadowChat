'use client';

import useAppStore from '@/store';
import {
  Archive,
  BellOff,
  Copy,
  Forward,
  Info,
  MessageSquare,
  Pin,
  Reply,
  Search,
  Star,
  Trash,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useContextMenuCtx } from './ContextMenuProvider';

// ─── Menu item primitives ──────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  separator?: boolean; // renders a divider BEFORE this item
  disabled?: boolean; // grayed-out + non-interactive (feature not yet implemented)
}

interface MenuItemRowProps {
  item: MenuItem;
  onClose: () => void;
}

function MenuItemRow({ item, onClose }: MenuItemRowProps) {
  return (
    <>
      {item.separator && (
        <div className="my-1 border-t border-[#3d5a65]" aria-hidden="true" />
      )}
      <button
        id={`ctx-menu-${item.id}`}
        disabled={item.disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (item.disabled) return;
          item.onClick();
          onClose();
        }}
        className={[
          'flex w-full items-center gap-3 px-4 py-2.5',
          'text-sm transition-colors duration-100',
          'focus:outline-none',
          item.disabled
            ? 'cursor-not-allowed opacity-40 select-none' // Improved opacity for better legibility
            : item.danger
              ? 'cursor-pointer text-red-400 hover:bg-red-500/10'
              : 'cursor-pointer text-[#d1d7db] hover:bg-[#182229]',
        ].join(' ')}
      >
        <span
          className={`h-4 w-4 shrink-0 ${item.disabled ? 'text-[#8696a0]' : ''}`}
        >
          {item.icon}
        </span>
        <span
          className={`flex-1 text-left ${item.disabled ? 'text-[#8696a0]' : ''}`}
        >
          {item.label}
        </span>
        {/* Subtle dot instead of "Soon" badge for a cleaner UI */}
        {item.disabled && (
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#3d5a65]"
            title="Coming soon"
            aria-label="Coming soon"
          />
        )}
      </button>
    </>
  );
}

// ─── Per-zone menu configs ────────────────────────────────────────────────────

function useChatItemMenuItems(
  data: Record<string, unknown>,
  onClose: () => void
): MenuItem[] {
  const clearChat = useAppStore((s) => s.clearChat);
  const deleteChat = useAppStore((s) => s.deleteChat);
  const markAsRead = useAppStore((s) => s.markAsRead);

  const chatId = data.chatId as string | undefined;

  return [
    {
      id: 'archive',
      label: 'Archive chat',
      icon: <Archive className="h-4 w-4" />,
      onClick: () => {},
      disabled: true,
    },
    {
      id: 'mute',
      label: 'Mute notifications',
      icon: <BellOff className="h-4 w-4" />,
      onClick: () => {},
      disabled: true,
    },
    {
      id: 'pin',
      label: 'Pin chat',
      icon: <Pin className="h-4 w-4" />,
      onClick: () => {},
      disabled: true,
    },
    {
      id: 'mark-read',
      label: 'Mark as read',
      icon: <MessageSquare className="h-4 w-4" />,
      onClick: () => {
        if (chatId) markAsRead(chatId);
      },
    },
    {
      id: 'clear',
      label: 'Clear chat',
      icon: <Trash className="h-4 w-4" />,
      separator: true,
      onClick: () => {
        if (chatId) clearChat(chatId);
      },
    },
    {
      id: 'delete',
      label: 'Delete chat',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => {
        if (chatId) {
          deleteChat(chatId);
          onClose();
        }
      },
      danger: true,
    },
  ];
}

function useMessageMenuItems(data: Record<string, unknown>): MenuItem[] {
  const content = data.content as string | undefined;

  return [
    {
      id: 'reply',
      label: 'Reply',
      icon: <Reply className="h-4 w-4" />,
      onClick: () => {},
      disabled: true,
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: <Copy className="h-4 w-4" />,
      onClick: () => {
        if (content)
          navigator.clipboard.writeText(content).catch(console.error);
      },
    },
    {
      id: 'forward',
      label: 'Forward',
      icon: <Forward className="h-4 w-4" />,
      onClick: () => {},
      disabled: true,
    },
    {
      id: 'star',
      label: 'Star message',
      icon: <Star className="h-4 w-4" />,
      onClick: () => {},
      disabled: true,
    },
    {
      id: 'delete-msg',
      label: 'Delete message',
      icon: <Trash2 className="h-4 w-4" />,
      separator: true,
      onClick: () => {},
      danger: true,
      disabled: true,
    },
  ];
}

function useChatBgMenuItems(data: Record<string, unknown>): MenuItem[] {
  const setActiveChatId = useAppStore((s) => s.setActiveChatId);
  const clearChat = useAppStore((s) => s.clearChat);
  const openContactInfo = useAppStore((s) => s.openContactInfo);
  const chatId = data.chatId as string | undefined;
  const onSearchToggle = data.onSearchToggle as (() => void) | undefined;

  return [
    {
      id: 'contact-info',
      label: 'Contact info',
      icon: <Info className="h-4 w-4" />,
      onClick: () => {
        openContactInfo();
      },
    },
    {
      id: 'search',
      label: 'Search messages',
      icon: <Search className="h-4 w-4" />,
      onClick: () => onSearchToggle?.(),
    },
    {
      id: 'clear-chat',
      label: 'Clear chat',
      icon: <Trash className="h-4 w-4" />,
      onClick: () => {
        if (chatId) clearChat(chatId);
      },
    },
    {
      id: 'close-chat',
      label: 'Close chat',
      icon: <X className="h-4 w-4" />,
      separator: true,
      onClick: () => setActiveChatId(null),
    },
  ];
}

// ─── Main floating component ───────────────────────────────────────────────────

const MENU_WIDTH = 220; // px — used for horizontal collision detection

export default function ContextMenu() {
  const { state, closeMenu } = useContextMenuCtx();
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Viewport-adjusted position ──────────────────────────────────────────────
  const [pos, setPos] = useState({ x: state.x, y: state.y });

  useLayoutEffect(() => {
    if (!state.isOpen || !menuRef.current) return;

    const menuH = menuRef.current.offsetHeight;
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    const x = state.x + MENU_WIDTH > winW ? state.x - MENU_WIDTH : state.x;
    const y = state.y + menuH > winH ? state.y - menuH : state.y;

    setPos({ x, y });
  }, [state.isOpen, state.x, state.y]);

  const chatItemItems = useChatItemMenuItems(state.data, closeMenu);
  const messageItems = useMessageMenuItems(state.data);
  const chatBgItems = useChatBgMenuItems(state.data);

  const items: MenuItem[] =
    state.menuType === 'chat-item'
      ? chatItemItems
      : state.menuType === 'message-bubble'
        ? messageItems
        : state.menuType === 'chat-background'
          ? chatBgItems
          : [];

  // Animate in/out safely
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (state.isOpen) {
      // Small delay to allow mounting before triggering CSS transition
      timeoutId = setTimeout(() => {
        setVisible(true);
      }, 10);
    } else {
      // Asynchronously set visible to false to bypass linter error
      timeoutId = setTimeout(() => {
        setVisible(false);
      }, 0);
    }

    return () => clearTimeout(timeoutId);
  }, [state.isOpen]);

  if (!state.isOpen) return null;

  return (
    <div
      ref={menuRef}
      id="context-menu"
      role="menu"
      aria-label="Context menu"
      onContextMenu={(e) => e.preventDefault()} // prevent meta right-click on the menu itself
      onClick={(e) => e.stopPropagation()} // don't let click bubble to the window close handler
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        minWidth: MENU_WIDTH,
        transform: visible ? 'scale(1)' : 'scale(0.95)',
        opacity: visible ? 1 : 0,
        transformOrigin: 'top left',
        transition: 'transform 120ms ease, opacity 120ms ease',
      }}
      className="z-[9999] overflow-hidden rounded-lg bg-[#233138] py-1.5 shadow-2xl ring-1 ring-black/20"
    >
      {items.map((item) => (
        <MenuItemRow key={item.id} item={item} onClose={closeMenu} />
      ))}
    </div>
  );
}
