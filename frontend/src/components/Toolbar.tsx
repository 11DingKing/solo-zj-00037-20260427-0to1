import React from "react";
import {
  MousePointer2,
  Pencil,
  Minus,
  Square,
  Circle,
  Type,
  StickyNote,
  ArrowRight,
  Trash2,
} from "lucide-react";
import {
  useToolStore,
  useSelectionStore,
  useHistoryStore,
  useElementStore,
} from "@/store";
import { ToolType } from "@/types";

const tools: { type: ToolType; icon: React.ReactNode; label: string }[] = [
  { type: "select", icon: <MousePointer2 size={20} />, label: "选择 (V)" },
  { type: "pen", icon: <Pencil size={20} />, label: "画笔 (P)" },
  { type: "line", icon: <Minus size={20} />, label: "直线 (L)" },
  { type: "rectangle", icon: <Square size={20} />, label: "矩形 (R)" },
  { type: "circle", icon: <Circle size={20} />, label: "圆形 (C)" },
  { type: "text", icon: <Type size={20} />, label: "文本 (T)" },
  { type: "sticky", icon: <StickyNote size={20} />, label: "便签 (S)" },
  { type: "arrow", icon: <ArrowRight size={20} />, label: "箭头 (A)" },
];

const Toolbar: React.FC = () => {
  const {
    type,
    setTool,
    color,
    setColor,
    strokeWidth,
    setStrokeWidth,
    fillColor,
    setFillColor,
    stickyColor,
    setStickyColor,
    stickyColors,
  } = useToolStore();
  const { selectedIds, selectMultiple } = useSelectionStore();
  const { elements, deleteElements } = useElementStore();
  const { pushHistory } = useHistoryStore();

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    pushHistory(elements);
    deleteElements(selectedIds);
    selectMultiple([]);
  };

  return (
    <div className="flex flex-col items-center space-y-1">
      {/* Tools */}
      {tools.map((tool) => (
        <button
          key={tool.type}
          onClick={() => setTool(tool.type)}
          title={tool.label}
          className={`p-2.5 rounded-lg transition-all ${
            type === tool.type
              ? "bg-blue-100 text-blue-600"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {tool.icon}
        </button>
      ))}

      {/* Separator */}
      <div className="w-8 h-px bg-gray-200 my-2" />

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={selectedIds.length === 0}
        title="删除 (Delete)"
        className="p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <Trash2 size={20} />
      </button>

      {/* Separator */}
      <div className="w-8 h-px bg-gray-200 my-2" />

      {/* Color Picker */}
      <div className="relative group">
        <button
          className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
          style={{ backgroundColor: color }}
          title="画笔颜色"
        />
        <div className="absolute left-full ml-2 top-0 hidden group-hover:block z-50">
          <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-2">画笔颜色</p>
            <div className="grid grid-cols-8 gap-1">
              {[
                "#000000",
                "#374151",
                "#6B7280",
                "#9CA3AF",
                "#D1D5DB",
                "#E5E7EB",
                "#F3F4F6",
                "#FFFFFF",
                "#DC2626",
                "#EA580C",
                "#D97706",
                "#65A30D",
                "#059669",
                "#0891B2",
                "#2563EB",
                "#7C3AED",
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded border ${
                    color === c
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fill Color */}
      {(type === "rectangle" || type === "circle") && (
        <div className="relative group">
          <button
            className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
            style={{
              backgroundColor: fillColor === "transparent" ? "#fff" : fillColor,
              backgroundImage:
                fillColor === "transparent"
                  ? "linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)"
                  : "none",
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
            }}
            title="填充颜色"
          />
          <div className="absolute left-full ml-2 top-0 hidden group-hover:block z-50">
            <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">填充颜色</p>
              <div className="grid grid-cols-8 gap-1">
                <button
                  onClick={() => setFillColor("transparent")}
                  className={`w-5 h-5 rounded border ${
                    fillColor === "transparent"
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-300"
                  }`}
                  style={{
                    backgroundColor: "#fff",
                    backgroundImage:
                      "linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)",
                    backgroundSize: "8px 8px",
                  }}
                />
                {[
                  "#DC2626",
                  "#EA580C",
                  "#D97706",
                  "#65A30D",
                  "#059669",
                  "#0891B2",
                  "#2563EB",
                  "#7C3AED",
                  "#FEE2E2",
                  "#FFF7ED",
                  "#FEF3C7",
                  "#D9F99D",
                  "#CCFBF1",
                  "#CFFAFE",
                  "#DBEAFE",
                  "#EDE9FE",
                ].map((c) => (
                  <button
                    key={c}
                    onClick={() => setFillColor(c)}
                    className={`w-5 h-5 rounded border ${
                      fillColor === c
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Color */}
      {type === "sticky" && (
        <div className="relative group">
          <button
            className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
            style={{ backgroundColor: stickyColor }}
            title="便签颜色"
          />
          <div className="absolute left-full ml-2 top-0 hidden group-hover:block z-50">
            <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">便签颜色</p>
              <div className="grid grid-cols-4 gap-2">
                {stickyColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setStickyColor(c)}
                    className={`w-8 h-8 rounded border ${
                      stickyColor === c
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stroke Width */}
      {["pen", "line", "rectangle", "circle", "arrow"].includes(type) && (
        <div className="relative group">
          <div className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-lg cursor-pointer">
            <div
              className="rounded-full bg-gray-700"
              style={{
                width: strokeWidth,
                height: strokeWidth,
                minWidth: 4,
                minHeight: 4,
              }}
            />
          </div>
          <div className="absolute left-full ml-2 top-0 hidden group-hover:block z-50">
            <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200 w-40">
              <p className="text-xs text-gray-500 mb-2">
                线条粗细: {strokeWidth}px
              </p>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
