'use client';

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import {
  useContextMenu,
  type ContextMenuState,
  type MenuType,
} from '@/hooks/useContextMenu';

// ─── Context shape ────────────────────────────────────────────────────────────

interface ContextMenuCtx {
  state: ContextMenuState;
  openMenu: (
    e: React.MouseEvent,
    menuType: MenuType,
    data?: Record<string, unknown>
  ) => void;
  closeMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuCtx | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * ContextMenuProvider
 *
 * Mount this at the ChatLayout level (one level above ChatArea + Sidebar).
 * All child components can then call `useContextMenuCtx()` to open/close
 * the context menu without any prop drilling.
 */
export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const menu = useContextMenu();
  return (
    <ContextMenuContext.Provider value={menu}>
      {children}
    </ContextMenuContext.Provider>
  );
}

// ─── Consumer hook ────────────────────────────────────────────────────────────

/**
 * useContextMenuCtx
 *
 * Returns the shared context menu state and actions.
 * Must be used inside a <ContextMenuProvider>.
 */
export function useContextMenuCtx(): ContextMenuCtx {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) {
    throw new Error('useContextMenuCtx must be used inside <ContextMenuProvider>');
  }
  return ctx;
}
