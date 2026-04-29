import React from "react";
import { useElementStore, useSelectionStore } from "@/store";
import { CanvasElement } from "@/types";

const PropertiesPanel: React.FC = () => {
  const { selectedIds } = useSelectionStore();
  const { elements, updateElement } = useElementStore();

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));

  if (selectedElements.length === 0) return null;

  if (selectedElements.length > 1) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          已选择 {selectedElements.length} 个元素
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            可以使用对齐工具或批量移动这些元素。
          </p>
        </div>
      </div>
    );
  }

  const element = selectedElements[0];

  const handleChange = (property: string, value: any) => {
    updateElement(element.id, { [property]: value } as Partial<CanvasElement>);
  };

  const renderProperties = () => {
    const fields = [];

    // 位置
    fields.push(
      <div key="position" className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          位置
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">X</label>
            <input
              type="number"
              value={Math.round(element.x)}
              onChange={(e) => handleChange("x", parseFloat(e.target.value))}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Y</label>
            <input
              type="number"
              value={Math.round(element.y)}
              onChange={(e) => handleChange("y", parseFloat(e.target.value))}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>,
    );

    // 尺寸
    fields.push(
      <div key="size" className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          尺寸
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">宽</label>
            <input
              type="number"
              value={Math.round(element.width)}
              onChange={(e) =>
                handleChange("width", parseFloat(e.target.value))
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">高</label>
            <input
              type="number"
              value={Math.round(element.height)}
              onChange={(e) =>
                handleChange("height", parseFloat(e.target.value))
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>,
    );

    // 旋转
    fields.push(
      <div key="rotation" className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          旋转
        </h4>
        <div>
          <label className="block text-xs text-gray-500 mb-1">角度</label>
          <input
            type="range"
            min="0"
            max="360"
            value={element.rotation}
            onChange={(e) =>
              handleChange("rotation", parseFloat(e.target.value))
            }
            className="w-full"
          />
          <span className="text-xs text-gray-500">
            {Math.round(element.rotation)}°
          </span>
        </div>
      </div>,
    );

    // 不透明度
    fields.push(
      <div key="opacity" className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          不透明度
        </h4>
        <div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={element.opacity}
            onChange={(e) =>
              handleChange("opacity", parseFloat(e.target.value))
            }
            className="w-full"
          />
          <span className="text-xs text-gray-500">
            {Math.round(element.opacity * 100)}%
          </span>
        </div>
      </div>,
    );

    // 特定属性
    switch (element.type) {
      case "pen":
      case "line":
      case "arrow":
        fields.push(
          <div key="stroke" className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              线条
            </h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">颜色</label>
              <input
                type="color"
                value={element.color}
                onChange={(e) => handleChange("color", e.target.value)}
                className="w-full h-8 cursor-pointer border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">粗细</label>
              <input
                type="range"
                min="1"
                max="20"
                value={"strokeWidth" in element ? element.strokeWidth : 2}
                onChange={(e) =>
                  handleChange("strokeWidth", parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>
          </div>,
        );
        break;

      case "rectangle":
      case "circle":
        fields.push(
          <div key="shape" className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              形状
            </h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">填充</label>
              <input
                type="color"
                value={
                  "fill" in element && element.fill !== "transparent"
                    ? element.fill
                    : "#ffffff"
                }
                onChange={(e) => handleChange("fill", e.target.value)}
                className="w-full h-8 cursor-pointer border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">边框</label>
              <input
                type="color"
                value={"stroke" in element ? element.stroke : "#000000"}
                onChange={(e) => handleChange("stroke", e.target.value)}
                className="w-full h-8 cursor-pointer border border-gray-300 rounded"
              />
            </div>
            {"borderRadius" in element && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">圆角</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={element.borderRadius}
                  onChange={(e) =>
                    handleChange("borderRadius", parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            )}
          </div>,
        );
        break;

      case "text":
        fields.push(
          <div key="text" className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              文本
            </h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">内容</label>
              <textarea
                value={element.content}
                onChange={(e) => handleChange("content", e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">字号</label>
              <input
                type="range"
                min="8"
                max="72"
                value={element.fontSize}
                onChange={(e) =>
                  handleChange("fontSize", parseInt(e.target.value))
                }
                className="w-full"
              />
              <span className="text-xs text-gray-500">
                {element.fontSize}px
              </span>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">颜色</label>
              <input
                type="color"
                value={element.color}
                onChange={(e) => handleChange("color", e.target.value)}
                className="w-full h-8 cursor-pointer border border-gray-300 rounded"
              />
            </div>
          </div>,
        );
        break;

      case "sticky":
        fields.push(
          <div key="sticky" className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              便签
            </h4>
            <div>
              <label className="block text-xs text-gray-500 mb-1">内容</label>
              <textarea
                value={element.content}
                onChange={(e) => handleChange("content", e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                rows={5}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">背景色</label>
              <input
                type="color"
                value={element.backgroundColor}
                onChange={(e) =>
                  handleChange("backgroundColor", e.target.value)
                }
                className="w-full h-8 cursor-pointer border border-gray-300 rounded"
              />
            </div>
          </div>,
        );
        break;
    }

    return fields;
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">属性</h3>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">{renderProperties()}</div>
    </div>
  );
};

export default PropertiesPanel;
