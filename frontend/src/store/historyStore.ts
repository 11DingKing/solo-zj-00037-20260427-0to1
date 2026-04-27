import { create } from "zustand";
import { CanvasElement, HistoryState } from "@/types";

interface HistoryStore extends HistoryState {
  pushHistory: (elements: CanvasElement[]) => void;
  undo: () => CanvasElement[] | null;
  redo: () => CanvasElement[] | null;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

const MAX_STEPS = 50;

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  present: [],
  future: [],
  maxSteps: MAX_STEPS,

  get canUndo() {
    return get().past.length > 0;
  },

  get canRedo() {
    return get().future.length > 0;
  },

  pushHistory: (elements) =>
    set((state) => {
      const newPast = [
        ...state.past,
        JSON.parse(JSON.stringify(state.present)),
      ];

      if (newPast.length > MAX_STEPS) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: JSON.parse(JSON.stringify(elements)),
        future: [],
      };
    }),

  undo: () => {
    const { past, present } = get();
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set({
      past: newPast,
      present: previous,
      future: [present, ...get().future],
    });

    return previous;
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return null;

    const next = future[0];
    const newFuture = future.slice(1);

    set((state) => ({
      past: [...state.past, state.present],
      present: next,
      future: newFuture,
    }));

    return next;
  },

  clearHistory: () =>
    set({
      past: [],
      present: [],
      future: [],
    }),
}));
