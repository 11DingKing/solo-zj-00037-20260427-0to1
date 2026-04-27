import { create } from "zustand";
import { Point, SelectionState } from "@/types";

interface SelectionStore extends SelectionState {
  select: (id: string, addToSelection?: boolean) => void;
  selectMultiple: (ids: string[]) => void;
  deselect: (id: string) => void;
  deselectAll: () => void;
  startSelection: (point: Point) => void;
  updateSelection: (point: Point) => void;
  endSelection: () => void;
}

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  selectedIds: [],
  isSelecting: false,
  selectionStart: undefined,
  selectionEnd: undefined,

  select: (id, addToSelection = false) =>
    set((state) => {
      if (addToSelection) {
        const alreadySelected = state.selectedIds.includes(id);
        return {
          selectedIds: alreadySelected
            ? state.selectedIds.filter((i) => i !== id)
            : [...state.selectedIds, id],
        };
      }
      return { selectedIds: [id] };
    }),

  selectMultiple: (ids) => set({ selectedIds: ids }),

  deselect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.filter((i) => i !== id),
    })),

  deselectAll: () => set({ selectedIds: [], isSelecting: false }),

  startSelection: (point) =>
    set({
      isSelecting: true,
      selectionStart: point,
      selectionEnd: point,
    }),

  updateSelection: (point) => {
    const { isSelecting } = get();
    if (isSelecting) {
      set({ selectionEnd: point });
    }
  },

  endSelection: () =>
    set({
      isSelecting: false,
      selectionStart: undefined,
      selectionEnd: undefined,
    }),
}));
