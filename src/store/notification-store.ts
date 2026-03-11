"use client";

import { create } from "zustand";

interface NotificationState {
  unreadCount: number;
  isCommandPaletteOpen: boolean;
  incrementUnread: () => void;
  clearUnread: () => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  isCommandPaletteOpen: false,
  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),
  clearUnread: () => set({ unreadCount: 0 }),
  setCommandPaletteOpen: (isOpen: boolean) => set({ isCommandPaletteOpen: isOpen }),
}));
