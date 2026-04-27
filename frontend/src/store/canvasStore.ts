import { create } from "zustand";
import { CanvasState } from "@/types";

interface CanvasStore extends CanvasState {
  setOffset: (x: number, y: number) => void;
  setZoom: (zoom: number) => void;
  translate: (dx: number, dy: number) => void;
  zoomAt: (deltaZoom: number, centerX: number, centerY: number) => void;
  reset: () => void;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

export const useCanvasStore = create<CanvasStore>((set) => ({
  offsetX: 0,
  offsetY: 0,
  zoom: 1,

  setOffset: (x, y) => set({ offsetX: x, offsetY: y }),

  setZoom: (zoom) =>
    set((state) => ({
      zoom: Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM),
    })),

  translate: (dx, dy) =>
    set((state) => ({
      offsetX: state.offsetX + dx,
      offsetY: state.offsetY + dy,
    })),

  zoomAt: (deltaZoom, centerX, centerY) =>
    set((state) => {
      const newZoom = Math.min(
        Math.max(state.zoom + deltaZoom, MIN_ZOOM),
        MAX_ZOOM,
      );
      const zoomFactor = newZoom / state.zoom;

      return {
        zoom: newZoom,
        offsetX: centerX - (centerX - state.offsetX) * zoomFactor,
        offsetY: centerY - (centerY - state.offsetY) * zoomFactor,
      };
    }),

  reset: () => set({ offsetX: 0, offsetY: 0, zoom: 1 }),
}));
