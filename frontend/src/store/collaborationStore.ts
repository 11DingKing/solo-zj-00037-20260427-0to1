import { create } from "zustand";
import { CursorPosition, OnlineUser } from "@/types";

interface CollaborationStore {
  onlineUsers: OnlineUser[];
  cursorPositions: Map<string, CursorPosition>;
  isConnected: boolean;
  setOnlineUsers: (users: OnlineUser[]) => void;
  addOnlineUser: (user: OnlineUser) => void;
  removeOnlineUser: (userId: string) => void;
  updateCursorPosition: (userId: string, cursor: CursorPosition) => void;
  removeCursorPosition: (userId: string) => void;
  setConnected: (connected: boolean) => void;
  clearCollaboration: () => void;
}

export const useCollaborationStore = create<CollaborationStore>((set) => ({
  onlineUsers: [],
  cursorPositions: new Map(),
  isConnected: false,

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  addOnlineUser: (user) =>
    set((state) => {
      const existing = state.onlineUsers.find((u) => u.userId === user.userId);
      if (existing) {
        return {
          onlineUsers: state.onlineUsers.map((u) =>
            u.userId === user.userId ? { ...u, isOnline: true } : u,
          ),
        };
      }
      return {
        onlineUsers: [...state.onlineUsers, { ...user, isOnline: true }],
      };
    }),

  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.map((u) =>
        u.userId === userId ? { ...u, isOnline: false } : u,
      ),
    })),

  updateCursorPosition: (userId, cursor) =>
    set((state) => {
      const newCursors = new Map(state.cursorPositions);
      newCursors.set(userId, cursor);
      return { cursorPositions: newCursors };
    }),

  removeCursorPosition: (userId) =>
    set((state) => {
      const newCursors = new Map(state.cursorPositions);
      newCursors.delete(userId);
      return { cursorPositions: newCursors };
    }),

  setConnected: (isConnected) => set({ isConnected }),

  clearCollaboration: () =>
    set({
      onlineUsers: [],
      cursorPositions: new Map(),
      isConnected: false,
    }),
}));
