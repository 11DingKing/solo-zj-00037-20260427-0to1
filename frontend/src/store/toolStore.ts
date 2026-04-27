import { create } from "zustand";
import { ToolType, ToolState } from "@/types";

const DEFAULT_STICKY_COLORS = [
  "#FFF9C4",
  "#C8E6C9",
  "#BBDEFB",
  "#F8BBD9",
  "#E1BEE7",
  "#FFCC80",
  "#F48FB1",
  "#80D8FF",
];

interface ToolStore extends ToolState {
  setTool: (type: ToolType) => void;
  setColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFillColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setStickyColor: (color: string) => void;
  stickyColors: string[];
}

export const useToolStore = create<ToolStore>((set) => ({
  type: "select",
  color: "#000000",
  strokeWidth: 2,
  fillColor: "transparent",
  fontSize: 16,
  stickyColor: DEFAULT_STICKY_COLORS[0],
  stickyColors: DEFAULT_STICKY_COLORS,

  setTool: (type) => set({ type }),
  setColor: (color) => set({ color }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
  setFillColor: (fillColor) => set({ fillColor }),
  setFontSize: (fontSize) => set({ fontSize }),
  setStickyColor: (stickyColor) => set({ stickyColor }),
}));
