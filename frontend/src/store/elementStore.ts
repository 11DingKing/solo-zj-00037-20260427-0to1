import { create } from "zustand";
import { CanvasElement } from "@/types";

interface ElementStore {
  elements: CanvasElement[];
  setElements: (elements: CanvasElement[]) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  deleteElements: (ids: string[]) => void;
  clearElements: () => void;
  getElementById: (id: string) => CanvasElement | undefined;
}

export const useElementStore = create<ElementStore>((set, get) => ({
  elements: [],

  setElements: (elements) => set({ elements }),

  addElement: (element) =>
    set((state) => ({
      elements: [...state.elements, element],
    })),

  updateElement: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates, updatedAt: Date.now() } : el,
      ),
    })),

  deleteElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
    })),

  deleteElements: (ids) =>
    set((state) => ({
      elements: state.elements.filter((el) => !ids.includes(el.id)),
    })),

  clearElements: () => set({ elements: [] }),

  getElementById: (id) => get().elements.find((el) => el.id === id),
}));
