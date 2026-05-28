'use client';

import { useCallback, useEffect, useReducer } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MenuType = 'chat-item' | 'message-bubble' | 'chat-background';

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  menuType: MenuType | null;
  /** Arbitrary payload relevant to the menu type (chatId, messageId, etc.) */
  data: Record<string, unknown>;
}

type Action =
  | { type: 'OPEN'; x: number; y: number; menuType: MenuType; data: Record<string, unknown> }
  | { type: 'CLOSE' };

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState: ContextMenuState = {
  isOpen: false,
  x: 0,
  y: 0,
  menuType: null,
  data: {},
};

function reducer(state: ContextMenuState, action: Action): ContextMenuState {
  switch (action.type) {
    case 'OPEN':
      return {
        isOpen: true,
        x: action.x,
        y: action.y,
        menuType: action.menuType,
        data: action.data,
      };
    case 'CLOSE':
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseContextMenuReturn {
  state: ContextMenuState;
  openMenu: (
    e: React.MouseEvent,
    menuType: MenuType,
    data?: Record<string, unknown>
  ) => void;
  closeMenu: () => void;
}

/**
 * useContextMenu
 *
 * Manages the floating context menu state: position, type, and payload.
 *
 * • openMenu  — call inside onContextMenu handlers; prevents the native menu.
 * • closeMenu — call programmatically or it fires automatically on any
 *               window click, Escape key, or scroll.
 */
export function useContextMenu(): UseContextMenuReturn {
  const [state, dispatch] = useReducer(reducer, initialState);

  const openMenu = useCallback(
    (
      e: React.MouseEvent,
      menuType: MenuType,
      data: Record<string, unknown> = {}
    ) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch({ type: 'OPEN', x: e.clientX, y: e.clientY, menuType, data });
    },
    []
  );

  const closeMenu = useCallback(() => dispatch({ type: 'CLOSE' }), []);

  // Auto-close on any click, scroll, or Escape key outside the menu
  useEffect(() => {
    if (!state.isOpen) return;

    const handleClose = () => closeMenu();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };

    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true); // capture phase for nested scrollers
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isOpen, closeMenu]);

  return { state, openMenu, closeMenu };
}
